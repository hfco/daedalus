{ inputs, targetSystem, cluster }:

assert targetSystem == "x86_64-darwin" || targetSystem == "aarch64-darwin";

let

  newCommon = import ./new-common.nix { inherit inputs targetSystem cluster; };

  inherit (newCommon) sourceLib oldCode pkgs;
  inherit (pkgs) lib;

  inherit (oldCode)
    daedalus-bridge daedalus-installer launcherConfigs mock-token-metadata-server
    cardanoNodeVersion cardanoWalletVersion;

  inherit (newCommon) originalPackageJson electronVersion electronChromedriverVersion commonSources;

  archSuffix = if pkgs.system == "aarch64-darwin" then "arm64" else "x64";
  packageVersion = originalPackageJson.version;
  installerName = "daedalus-${packageVersion}.${toString sourceLib.buildRevCount}-${cluster}-${sourceLib.buildRevShort}-${pkgs.system}";

  # # On Catalina (x86), we can’t detect Ledger devices, unless:
  # theSDK = if targetSystem == "aarch64-darwin" then {
  #   apple_sdk = pkgs.darwin.apple_sdk;
  #   xcbuild = pkgs.xcbuild;
  # } else rec {
  #   apple_sdk = pkgs.darwin.apple_sdk_11_0;
  #   xcbuild = pkgs.xcbuild.override {
  #     inherit (apple_sdk) stdenv;
  #     inherit (apple_sdk.frameworks) CoreServices CoreGraphics ImageIO;
  #     #sdkVer = "11.0";
  #   };
  # };

in rec {

  inherit newCommon oldCode;
  inherit (newCommon) nodejs nodePackages yarn yarn2nix offlineCache srcLockfiles srcWithoutNix;

  # The following is used in all `configurePhase`s:
  darwinSpecificCaches = let
    cacheDir = "$HOME/Library/Caches";
  in ''
    mkdir -p ${cacheDir}/electron/${darwinSources.electronCacheHash}/
    ln -sf ${commonSources.electronShaSums} ${cacheDir}/electron/${commonSources.electronCacheHash}/SHASUMS256.txt
    ln -sf ${darwinSources.electron} ${cacheDir}/electron/${commonSources.electronCacheHash}/electron-v${electronVersion}-darwin-${archSuffix}.zip

    mkdir -p ${cacheDir}/electron/${commonSources.electronChromedriverCacheHash}/
    ln -sf ${commonSources.electronChromedriverShaSums} ${cacheDir}/electron/${commonSources.electronChromedriverCacheHash}/SHASUMS256.txt
    ln -sf ${darwinSources.electronChromedriver} ${cacheDir}/electron/${commonSources.electronChromedriverCacheHash}/chromedriver-v${commonSources.electronChromedriverVersion}-darwin-${archSuffix}.zip
  '';

  # XXX: we don't use `autoSignDarwinBinariesHook` for ad-hoc signing,
  # because it takes too long (minutes) for all the JS/whatnot files we
  # have. Instead, we locate targets in a more clever way.
  signAllBinaries = pkgs.writeShellScript "signAllBinaries" ''
    set -o nounset
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
      ++ (with pkgs; [ python3 pkgconfig darwin.cctools /*theSDK.*/xcbuild ]);
    buildInputs = (with pkgs.darwin; [
      #/*theSDK.*/apple_sdk.frameworks.IOKit
      /*theSDK.*/apple_sdk.frameworks.CoreServices   # old-shell.nix has this instead of IOKit, let’s try
      /*theSDK.*/apple_sdk.frameworks.AppKit
      #(theSDK.apple_sdk.sdk or theSDK.apple_sdk.MacOSX-SDK)
    ]);
    configurePhase = newCommon.setupCacheAndGypDirs + darwinSpecificCaches;
    buildPhase = ''
      # Do not look up in the registry, but in the offline cache:
      ${yarn2nix.fixup_yarn_lock}/bin/fixup_yarn_lock yarn.lock

      # Now, install from ${offlineCache} to node_modules/
      yarn install --frozen-lockfile

      patchShebangs . >/dev/null  # a real lot of paths to patch, no need to litter logs
    '';
    installPhase = ''
      mkdir $out
      cp -r node_modules $out/

      ${signAllBinaries} $out
    '';
    dontFixup = true; # TODO: just to shave some seconds, turn back on after everything works
  };

  darwin-launcher = pkgs.callPackage ./darwin-launcher.nix {};

  package = let
    pname = "daedalus";
  in pkgs.stdenv.mkDerivation {
    name = pname;
    src = srcWithoutNix;
    nativeBuildInputs = [ yarn nodejs daedalus-installer ]
      ++ (with pkgs; [ python3 pkgconfig darwin.cctools /*theSDK.*/xcbuild ]);
    buildInputs = (with pkgs.darwin; [
      /*theSDK.*/apple_sdk.frameworks.CoreServices
      /*theSDK.*/apple_sdk.frameworks.AppKit
      libobjc
      #(theSDK.apple_sdk.sdk or theSDK.apple_sdk.MacOSX-SDK)
    ]) ++ [
      daedalus-bridge
      darwin-launcher
      mock-token-metadata-server
    ];
    NETWORK = cluster;
    BUILD_REV = sourceLib.buildRev;
    BUILD_REV_SHORT = sourceLib.buildRevShort;
    BUILD_REV_COUNT = sourceLib.buildRevCount;
    CARDANO_WALLET_VERSION = cardanoWalletVersion;
    CARDANO_NODE_VERSION = cardanoNodeVersion;
    configurePhase = newCommon.setupCacheAndGypDirs + darwinSpecificCaches + ''
      # Grab all cached `node_modules` from above:
      cp -r ${node_modules}/. ./
      chmod -R +w .
    '';
    outputs = [ "out" "futureInstaller" ];
    buildPhase = ''
      patchShebangs .
      sed -r 's#.*patchElectronRebuild.*#${newCommon.patchElectronRebuild}/bin/*#' -i scripts/rebuild-native-modules.sh

      export DEVX_FIXME_DONT_YARN_INSTALL=1
      (
        cd installers/
        cp -r ${launcherConfigs.configFiles}/. ./.

        # make-installer needs to see `bin/nix-store` to break all references to dylibs inside /nix/store:
        export PATH="${lib.makeBinPath [ pkgs.nixUnstable ]}:$PATH"

        make-installer --cardano ${daedalus-bridge} \
          --build-rev-short ${sourceLib.buildRevShort} \
          --build-rev-count ${toString sourceLib.buildRevCount} \
          --cluster ${cluster} \
          --out-dir doesnt-matter \
          --dont-pkgbuild
      )
    '';
    installPhase = ''
      mkdir -p $out/Applications/
      cp -r release/darwin-${archSuffix}/${lib.escapeShellArg launcherConfigs.installerConfig.spacedName}-darwin-${archSuffix}/${lib.escapeShellArg launcherConfigs.installerConfig.spacedName}.app $out/Applications/

      # XXX: For `nix run`, unfortunately, we cannot use symlinks, because then golang’s `os.Executable()`
      # will not return the target, but the symlink, and all paths will break… :sigh:
      mkdir -p $out/bin/
      cat >$out/bin/${pname} << EOF
      #!/bin/sh
      exec $out/Applications/${lib.escapeShellArg launcherConfigs.installerConfig.spacedName}.app/Contents/MacOS/${lib.escapeShellArg launcherConfigs.installerConfig.spacedName}
      EOF
      chmod +x $out/bin/${pname}

      # Further signing for notarization (cannot be done purely):
      mkdir -p $futureInstaller/
      chmod +x installers/codesign.sh
      cp installers/{codesign.sh,entitlements.xml} $futureInstaller/

      ${signAllBinaries} $out
    '';
    dontFixup = true; # TODO: just to shave some seconds, turn back on after everything works
  };

  unsignedInstaller = pkgs.stdenv.mkDerivation {
    name = "daedalus-unsigned-darwin-installer";
    dontUnpack = true;
    buildPhase = ''
      ${makeSignedInstaller}/bin/* | tee make-installer.log
    '';
    installPhase = ''
      mkdir -p $out
      cp $(tail -n 1 make-installer.log) $out/
    '';
  };

  makeSignedInstaller = pkgs.writeShellScriptBin "make-signed-installer" (let

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
      appName=${lib.escapeShellArg launcherConfigs.installerConfig.spacedName}.app
      appDir=${package}/Applications/"$appName"

      echo "Info: workDir = $workDir"
      cd "$workDir"

      echo "Copying…"
      cp -r "$appDir" ./.
      chmod -R +w .

      if ${shallSignPredicate} ; then
        echo "Signing code…"
        ${package.futureInstaller}/codesign.sh "$codeSigningIdentity" "$codeSigningKeyChain" \
          "$appName" ${package.futureInstaller}/entitlements.xml
      fi

      echo "Making installer…"
      /usr/bin/pkgbuild \
        --identifier ${lib.escapeShellArg ("org." + launcherConfigs.installerConfig.macPackageName + ".pkg")} \
        --component "$workDir/$appName" \
        --install-location /Applications \
        ${lib.escapeShellArg (installerName + ".phase1.pkg")}
      rm -r "$workDir/$appName"
      /usr/bin/productbuild --product ${../installers/data/plist} \
        --package *.phase1.pkg \
        ${lib.escapeShellArg (installerName + ".phase2.pkg")}
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
          ${lib.escapeShellArg (installerName + ".pkg")}
        rm *.phase2.pkg
      else
        mv *.phase2.pkg ${lib.escapeShellArg (installerName + ".pkg")}
      fi

      echo "Done, you can submit it for notarization now:"
      echo "$workDir"/${lib.escapeShellArg (installerName + ".pkg")}
    '';

  in ''
    cd /
    ${bashSetup}
    if ${shallSignPredicate} && [ "$USER" == "root" ]; then
      exec sudo -u buildkite-agent ${packAndSign}
    else
      exec ${packAndSign}
    fi
  '');

  darwinSources = {
    electron = pkgs.fetchurl {
      url = "https://github.com/electron/electron/releases/download/v${electronVersion}/electron-v${electronVersion}-darwin-${archSuffix}.zip";
      hash =
        if archSuffix == "x64"
        then "sha256-a/CXlNbwILuq+AandY2hJRN7PJZkb0UD64G5VB5Q4C8="
        else "sha256-N03fBYF5SzHu6QCCgXL5IYGTwDLA5Gv/z6xq7JXCLxo=";
    };

    electronChromedriver = pkgs.fetchurl {
      url = "https://github.com/electron/electron/releases/download/v${commonSources.electronChromedriverVersion}/chromedriver-v${electronChromedriverVersion}-darwin-${archSuffix}.zip";
      hash =
        if archSuffix == "x64"
        then "sha256-avLZdXPkcZx5SirO2RVjxXN2oRfbUHs5gEymUwne3HI="
        else "sha256-jehYm1nMlHjQha7AFzMUvKZxfSbedghODhBUXk1qKB4=";
    };
  };
}
