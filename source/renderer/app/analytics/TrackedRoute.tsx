import React, { FC, useEffect } from 'react';
import { matchPath, Route, RouteProps } from 'react-router';
import { useAnalytics } from '../components/analytics';

export type TrackedRouteProps = RouteProps & {
  pageTitle: string;
};

export const TrackedRoute: FC<TrackedRouteProps> = (props) => {
  const analytics = useAnalytics();
  const { pageTitle, ...restProps } = props;

  useEffect(() => {
    const match = matchPath(window.location.hash.replace('#', ''), props);

    if (match !== null) {
      analytics.sendPageNavigationEvent(props.pageTitle);
    }
  }, [window.location.pathname, props]);

  return <Route {...restProps} />;
};
