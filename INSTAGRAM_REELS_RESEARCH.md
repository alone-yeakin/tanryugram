# Instagram-style Reels research

## Verified official constraints

Meta's official IG Media reference states that the API returns media owned by Instagram professional accounts only and cannot be used to retrieve media owned by personal Instagram accounts: https://developers.facebook.com/documentation/instagram-platform/reference/instagram-media

Meta's official Content Publishing guide describes publishing images, videos, and Reels to an authenticated professional account. It does not provide a general public Reels discovery feed for arbitrary Instagram accounts: https://developers.facebook.com/documentation/instagram-platform/content-publishing

## Product implication

TanRyuGram should not scrape Instagram pages, use unofficial endpoints, proxy Instagram media without permission, or ask every user for broad Instagram access. The privacy-safe options are: (1) an Instagram-style vertical video feed made from TanRyuGram-hosted uploads; (2) an owner-curated feed of creator-authorized source links/embeds where permitted; or (3) an optional professional-account integration limited to the owner's or explicitly connected professional accounts, with minimal scopes and clear disconnect/delete controls.

The current code already contains an owner-facing placeholder called “Official Instagram Explore Integration” that claims it can sync reels, while the Explore page still contains YouTube-oriented media UI. That placeholder should not be presented as a working data sync until a compliant source and credentials are configured.
