{ inputs, targetSystem }:

assert targetSystem == "x86_64-darwin" || targetSystem == "aarch64-darwin";

let

  common = import ./common.nix { inherit inputs targetSystem; };

  inherit (common) sourceLib pkgs;
  inherit (pkgs) lib;

  inherit (common)
    daedalus-bridge daedalus-installer launcherConfigs mock-token-metadata-server
    cardanoNodeVersion cardanoWalletVersion;

  inherit (common) originalPackageJson electronVersion commonSources;

  archSuffix = if pkgs.system == "aarch64-darwin" then "arm64" else "x64";
  packageVersion = originalPackageJson.version;
  installerName = cluster: "daedalus-${packageVersion}-${toString sourceLib.buildCounter}-${cluster}-${sourceLib.buildRevShort}-${pkgs.system}";

  genClusters = lib.genAttrs sourceLib.installerClusters;

in rec {

  inherit common;
  inherit (common) nodejs yarn yarn2nix offlineCache srcLockfiles srcWithoutNix;

  # The following is used in all `configurePhase`s:
  darwinSpecificCaches = let
    cacheDir = "$HOME/Library/Caches";
  in ''
    mkdir -p ${cacheDir}/electron/${commonSources.electronCacheHash}/
    ln -sf ${commonSources.electronShaSums} ${cacheDir}/electron/${commonSources.electronCacheHash}/SHASUMS256.txt
    ln -sf ${darwinSources.electron} ${cacheDir}/electron/${commonSources.electronCacheHash}/electron-v${electronVersion}-darwin-${archSuffix}.zip
  '';

  # XXX: we don't use `autoSignDarwinBinariesHook` for ad-hoc signing,
  # because it takes too long (minutes) for all the JS/whatnot files we
  # have. Instead, we locate targets in a more clever way.
  signAllBinaries = pkgs.writeShellScript "signAllBinaries" ''
    set -o nounset
    echo 'Searching for binaries to ad-hoc sign…'
    source ${pkgs.darwin.signingUtils}
    ${pkgs.findutils}/bin/find "$1" -type f -not '(' -name '*.js' -o -name '*.ts' -o -name '*.ts.map' -o -name '*.js.map' -o -name '*.json' ')' -exec ${pkgs.file}/bin/file '{}' ';' | grep -F ': Mach-O' | cut -d: -f1 | while IFS= read -r target ; do
      echo "ad-hoc signing ‘$target’…"
      signIfRequired "$target"
    done
  '';

  # XXX: Whenever changing `yarn.lock`, make sure this still builds
  # without network. I.e. since there is no network sanbox in Nix on
  # Darwin, you have to first build `package` with network (to populate
  # /nix/store with pure dependencies), then add a newline in the middle
  # of `package.json`, and then build the `package` again, only this time
  # with network turned off system-wise.
  node_modules = pkgs.stdenv.mkDerivation {
    name = "daedalus-node_modules";
    src = srcLockfiles;
    nativeBuildInputs = [ yarn nodejs ]
      ++ (with pkgs; [ python3 pkgconfig jq darwin.cctools xcbuild perl /* for bufferutil */ ]);
    buildInputs = (with pkgs.darwin; [
      apple_sdk.frameworks.CoreServices
      apple_sdk.frameworks.AppKit
    ]);
    configurePhase = common.setupCacheAndGypDirs + darwinSpecificCaches;
    buildPhase = ''
      # Do not look up in the registry, but in the offline cache:
      ${yarn2nix.fixup_yarn_lock}/bin/fixup_yarn_lock yarn.lock

      # Now, install from ${offlineCache} to node_modules/
      yarn install --ignore-scripts

      # Remove all prebuilt *.node files extracted from `.tgz`s
      find . -type f -name '*.node' -not -path '*/@swc*/*' -exec rm -vf {} ';'

      patchShebangs . >/dev/null  # a real lot of paths to patch, no need to litter logs

      # This is building against Node.js, not Electron, but it still will fail, unless:
      ourArch="${__replaceStrings ["aarch64"] ["arm64"] (__head (__split "-" targetSystem))}"
      for f in \
        node_modules/usb/binding.gyp \
        node_modules/usb/libusb.gypi \
        node_modules/utf-8-validate/binding.gyp \
      ; do
        sed -r 's,-arch (x86_64|arm64),-arch '"$ourArch"',g' -i "$f"
      done

      # And now, with correct shebangs, run the install scripts (we have to do that
      # semi-manually, because another `yarn install` will overwrite those shebangs…):
      find node_modules -type f -name 'package.json' | sort | xargs grep -F '"install":' | cut -d: -f1 | while IFS= read -r dependency ; do
        # The grep pre-filter is not ideal:
        if [ "$(jq .scripts.install "$dependency")" != "null" ] ; then
          echo ' '
          echo "Running the install script for ‘$dependency’:"

          ( cd "$(dirname "$dependency")" ; yarn run install ; )
        fi
      done

      patchShebangs . >/dev/null  # a few new files will have appeared
    '';
    installPhase = ''
      mkdir $out
      cp -r node_modules $out/

      ${signAllBinaries} $out
    '';
    dontFixup = true; # TODO: just to shave some seconds, turn back on after everything works
  };

  darwin-launcher = pkgs.callPackage ./darwin-launcher.nix {};

  package = genClusters (cluster: let
    pname = "daedalus";
  in pkgs.stdenv.mkDerivation {
    name = pname;
    src = srcWithoutNix;
    nativeBuildInputs = [ yarn nodejs daedalus-installer ]
      ++ (with pkgs; [ python3 pkgconfig darwin.cctools xcbuild perl /* for bufferutil */ ]);
    buildInputs = (with pkgs.darwin; [
      apple_sdk.frameworks.CoreServices
      apple_sdk.frameworks.AppKit
      libobjc
    ]) ++ [
      daedalus-bridge.${cluster}
      darwin-launcher
      mock-token-metadata-server
    ];
    NETWORK = cluster;
    BUILD_REV = sourceLib.buildRev;
    BUILD_REV_SHORT = sourceLib.buildRevShort;
    BUILD_COUNTER = sourceLib.buildCounter;
    CARDANO_WALLET_VERSION = cardanoWalletVersion;
    CARDANO_NODE_VERSION = cardanoNodeVersion;
    configurePhase = common.setupCacheAndGypDirs + darwinSpecificCaches + ''
      # Grab all cached `node_modules` from above:
      cp -r ${node_modules}/. ./
      chmod -R +w .
    '';
    outputs = [ "out" "futureInstaller" ];
    buildPhase = ''
      patchShebangs .
      sed -r 's#.*patchElectronRebuild.*#${common.patchElectronRebuild}/bin/*#' -i scripts/rebuild-native-modules.sh

      sed -r "s/'127\.0\.0\.1'/undefined/g" -i node_modules/cardano-launcher/dist/src/cardanoNode.js

      sed -r "s/^const usb =.*/const usb = require(require('path').join(process.env.DAEDALUS_INSTALL_DIRECTORY, 'usb_bindings.node'));/g" \
        -i node_modules/usb/dist/usb/bindings.js

      export DEVX_FIXME_DONT_YARN_INSTALL=1
      (
        cd installers/
        cp -r ${launcherConfigs.${cluster}.configFiles}/. ./.

        # make-installer needs to see `bin/nix-store` to break all references to dylibs inside /nix/store:
        export PATH="${lib.makeBinPath [ pkgs.nixUnstable ]}:$PATH"

        make-installer --cardano ${daedalus-bridge.${cluster}} \
          --build-rev-short ${sourceLib.buildRevShort} \
          --build-counter ${toString sourceLib.buildCounter} \
          --cluster ${cluster} \
          --out-dir doesnt-matter \
          --dont-pkgbuild
      )
    '';
    installPhase = ''
      mkdir -p $out/Applications/
      cp -r release/darwin-${archSuffix}/${lib.escapeShellArg launcherConfigs.${cluster}.installerConfig.spacedName}-darwin-${archSuffix}/${lib.escapeShellArg launcherConfigs.${cluster}.installerConfig.spacedName}.app $out/Applications/

      # XXX: remove redundant native modules, and point bindings.js to Contents/MacOS/*.node instead:
      echo 'Deleting all redundant ‘*.node’ files under to-be-distributed ‘node_modules/’:'
      (
        cd $out/Applications/*/Contents/
        find Resources/ -name '*.node' -exec rm -vf '{}' ';'
        find Resources/app/node_modules -type f '(' -name '*.o' -o -name '*.o.d' -o -name '*.target.mk' -o -name '*.Makefile' -o -name 'Makefile' -o -name 'config.gypi' ')' -exec rm -vf '{}' ';'
        sed -r 's#try: \[#\0 [process.env.DAEDALUS_INSTALL_DIRECTORY, "bindings"],#' -i Resources/app/node_modules/bindings/bindings.js
      )

      # XXX: For `nix run`, unfortunately, we cannot use symlinks, because then golang’s `os.Executable()`
      # will not return the target, but the symlink, and all paths will break… :sigh:
      mkdir -p $out/bin/
      cat >$out/bin/${pname} << EOF
      #!/bin/sh
      exec $out/Applications/${lib.escapeShellArg launcherConfigs.${cluster}.installerConfig.spacedName}.app/Contents/MacOS/${lib.escapeShellArg launcherConfigs.${cluster}.installerConfig.spacedName}
      EOF
      chmod +x $out/bin/${pname}

      # Further signing for notarization (cannot be done purely):
      mkdir -p $futureInstaller/
      chmod +x installers/codesign.sh
      cp installers/{codesign.sh,entitlements.xml} $futureInstaller/

      ${signAllBinaries} $out
    '';
    dontFixup = true; # TODO: just to shave some seconds, turn back on after everything works
  });

  unsignedInstaller = genClusters (cluster: pkgs.stdenv.mkDerivation {
    name = "daedalus-unsigned-darwin-installer";
    dontUnpack = true;
    buildPhase = ''
      ${makeSignedInstaller.${cluster}}/bin/* | tee make-installer.log
    '';
    installPhase = ''
      mkdir -p $out
      cp $(tail -n 1 make-installer.log) $out/

      # Make it downloadable from Hydra:
      mkdir -p $out/nix-support
      echo "file binary-dist \"$(echo $out/*.pkg)\"" >$out/nix-support/hydra-build-products
    '';
  });

  makeSignedInstaller = genClusters (cluster: pkgs.writeShellScriptBin "make-signed-installer" (let

    # FIXME: in the future this has to be done better, now let’s reuse the Buildkite legacy:
    credentials = "/var/lib/buildkite-agent/signing.sh";
    codeSigningConfig = "/var/lib/buildkite-agent/code-signing-config.json";
    signingConfig = "/var/lib/buildkite-agent/signing-config.json";
    shallSignPredicate = "[ -f ${credentials} ] && [ -f ${codeSigningConfig} ] && [ -f ${signingConfig} ]";
    bashSetup = ''
      set -o errexit
      set -o pipefail
      set -o nounset
      export PATH="${lib.makeBinPath [ pkgs.coreutils pkgs.jq ]}:$PATH"
    '';
    readConfigs = pkgs.writeShellScript "read-signing-config" ''
      ${bashSetup}
      if ${shallSignPredicate} ; then
        echo "codeSigningIdentity='$(jq -r .codeSigningIdentity ${codeSigningConfig})'"
        echo "codeSigningKeyChain='$(jq -r .codeSigningKeyChain ${codeSigningConfig})'"
        echo "signingIdentity='$(jq -r .signingIdentity ${signingConfig})'"
        echo "signingKeyChain='$(jq -r .signingKeyChain ${signingConfig})'"
      else
        echo >&2 "Warning: code signing configs not found, installer will be unsigned, check" ${lib.escapeShellArg shallSignPredicate}
      fi
    '';

    packAndSign = pkgs.writeShellScript "pack-and-sign" ''
      ${bashSetup}

      eval $(${readConfigs})

      workDir=$(mktemp -d)
      appName=${lib.escapeShellArg launcherConfigs.${cluster}.installerConfig.spacedName}.app
      appDir=${package.${cluster}}/Applications/"$appName"

      echo "Info: workDir = $workDir"
      cd "$workDir"

      echo "Copying…"
      cp -r "$appDir" ./.
      chmod -R +w .

      if ${shallSignPredicate} ; then
        echo "Signing code…"
        ${package.${cluster}.futureInstaller}/codesign.sh "$codeSigningIdentity" "$codeSigningKeyChain" \
          "$appName" ${package.${cluster}.futureInstaller}/entitlements.xml
      fi

      echo "Making installer…"
      /usr/bin/pkgbuild \
        --identifier ${lib.escapeShellArg ("org." + launcherConfigs.${cluster}.installerConfig.macPackageName + ".pkg")} \
        --component "$workDir/$appName" \
        --install-location /Applications \
        ${lib.escapeShellArg ((installerName cluster) + ".phase1.pkg")}
      rm -r "$workDir/$appName"
      /usr/bin/productbuild --product ${../../installers/data/plist} \
        --package *.phase1.pkg \
        ${lib.escapeShellArg ((installerName cluster) + ".phase2.pkg")}
      rm *.phase1.pkg

      if ${shallSignPredicate} ; then
        echo "Signing installer…"

        # FIXME: this doesn’t work outside of `buildkite-agent`, it seems:
        #(
        #  source ${credentials}
        #  security unlock-keychain -p "$SIGNING" "$signingKeyChain"
        #)

        productsign --sign "$signingIdentity" --keychain "$signingKeyChain" \
          *.phase2.pkg \
          ${lib.escapeShellArg ((installerName cluster) + ".pkg")}
        rm *.phase2.pkg
      else
        mv *.phase2.pkg ${lib.escapeShellArg ((installerName cluster) + ".pkg")}
      fi

      echo "Done, you can submit it for notarization now:"
      echo "$workDir"/${lib.escapeShellArg ((installerName cluster) + ".pkg")}
    '';

  in ''
    cd /
    ${bashSetup}
    if ${shallSignPredicate} && [ "$USER" == "root" ]; then
      exec sudo -u buildkite-agent ${packAndSign}
    else
      exec ${packAndSign}
    fi
  ''));

  darwinSources = {
    electron = pkgs.fetchurl {
      name = "electron-v${electronVersion}-darwin-${archSuffix}.zip";
      url = "https://github.com/electron/electron/releases/download/v${electronVersion}/electron-v${electronVersion}-darwin-${archSuffix}.zip";
      hash =
        if archSuffix == "x64"
        then ""
        else "";
    };
  };
}
