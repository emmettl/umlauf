# Public Pages publication · 7 September 2026

Live site: https://emmettl.github.io/umlauf/

The initial approval covered publishing the site and bundled datasets publicly while retaining a private source repository. GitHub returned HTTP 422 when enabling Pages directly on the private repository because of its current plan. The public deployment repository [emmettl/umlauf-pages](https://github.com/emmettl/umlauf-pages) therefore contains only compiled HTML/CSS/JavaScript, the favicon, approved data artifacts and `.nojekyll`. Private source files, ignored source archives, credentials and source Git history were not copied.

## Source visibility

On 7 September 2026 the user separately confirmed making [emmettl/umlauf](https://github.com/emmettl/umlauf) and its full Git history public. GitHub now reports `visibility: public` and `private: false`. A focused scan of all 168 historical blobs found no credential patterns; retained VBB archives, the DB reference PDF and engineering HTML are ignored and absent from Git history. This scan is a bounded check, not a security guarantee.

After source publication, the user requested the canonical `/umlauf/` URL. Pages is now enabled directly on the public source repository, using its manual checked workflow. The owner-only Sites review retains its existing access settings. Source visibility does not automatically deploy new website builds.

## Initial release at `/umlauf-pages/`

- Source commit: `b97f1b16aff2bd1d6423a5fdbe5893a1a372e8d3`.
- Successful source checks and build artifact: [run 34159579680](https://github.com/emmettl/umlauf/actions/runs/34159579680), artifact `umlauf-preview`.
- Deployment commit: `3c95ded785c422c0bc7ba461116b3e80a848b8d0` in the separate deployment repository.
- Successful Pages deployment: [run 34161660665](https://github.com/emmettl/umlauf-pages/actions/runs/34161660665).
- Pages publishes `main` at `/`, with HTTPS enforced. Relative asset URLs support the `/umlauf-pages/` project path.

The public release includes the station-aware active-journey count correction. The private Sites review remains a separate, earlier review deployment. Public publication does not admit a numbered edition, finalise the working title, or establish physical-device performance or metric rail heights. The existing `noindex` request is retained; the site and its datasets are public.

## Canonical release at `/umlauf/`

- Source commit: `1df5b28ee26b554b54b6b9a6120c32bb6873c852` (documentation changes since the initial release; application and dataset bytes unchanged).
- Checks and Pages deployment: [run 34163250377](https://github.com/emmettl/umlauf/actions/runs/34163250377).
- Pages uses GitHub Actions, with HTTPS enforced and relative asset URLs rooted at `/umlauf/`.
- The former `/umlauf-pages/` address redirects visitors to the canonical site.

## Updating Pages

Run `.github/workflows/pages.yml` manually on the intended source ref. It runs the reusable check suite, downloads that run's `umlauf-preview` build, uploads the Pages artifact and deploys it. Source pushes alone do not publish. Verify the deployment succeeds and the served files match its build artifact; record the release here. The separate `umlauf-pages` repository is retained for the old-address redirect.
