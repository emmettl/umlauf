# Public Pages publication · 7 September 2026

Live site: https://emmettl.github.io/umlauf-pages/

The user explicitly approved publishing the site and bundled datasets publicly while retaining the private source repository. GitHub returned HTTP 422 when enabling Pages directly on the private repository because of its current plan. The public deployment repository [emmettl/umlauf-pages](https://github.com/emmettl/umlauf-pages) therefore contains only compiled HTML/CSS/JavaScript, the favicon, approved data artifacts and `.nojekyll`. Private source files, ignored source archives, credentials and source Git history were not copied.

## Exact release

- Source commit: `b97f1b16aff2bd1d6423a5fdbe5893a1a372e8d3`.
- Successful source checks and build artifact: [run 34159579680](https://github.com/emmettl/umlauf/actions/runs/34159579680), artifact `umlauf-preview`.
- Deployment commit: `3c95ded785c422c0bc7ba461116b3e80a848b8d0` in the separate deployment repository.
- Successful Pages deployment: [run 34161660665](https://github.com/emmettl/umlauf-pages/actions/runs/34161660665).
- Pages publishes `main` at `/`, with HTTPS enforced. Relative asset URLs support the `/umlauf-pages/` project path.

The public release includes the station-aware active-journey count correction. The private Sites review remains a separate, earlier review deployment. Public publication does not admit a numbered edition, finalise the working title, or establish physical-device performance or metric rail heights. The existing `noindex` request is retained; the site and its datasets are public.

## Updating Pages

Choose a source commit with successful checks, retrieve its `umlauf-preview` artifact, and inspect the complete static file list. Replace the deployment repository's previous build assets and data with that artifact, retaining `.nojekyll`; do not copy the source checkout or its Git history. Commit the deployment artifact with the source commit in the message, then push its `main` branch. Verify the Pages deployment succeeds and the served files match the chosen artifact. Record the source and deployment commits here. The private repository's original `pages.yml` workflow does not deploy this separate repository and remains unused.
