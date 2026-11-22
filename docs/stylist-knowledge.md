# Stylist knowledge: sources

`src/data/knowledge.ts` is the short stylist reference sent with every Claude request. These are the
sources and caveats behind it (researched November 2026). It's general guidance, not brand-specific truth.

## Vinted

- The official API, Vinted Pro Integrations, is only for approved business sellers managing their own items and orders. There is no public search API. [Vinted Pro Integrations docs](https://pro-docs.svc.vinted.com/)
- Vinted's terms don't allow automated tools that read or copy the site. Closet Scout only builds normal search links (`search_text`, `price_to`, `order`, plus filter IDs such as `size_ids[]`, `catalog[]`, copied from a link the user filtered on Vinted).
- Saved searches and notifications are Vinted's own way to follow new items. Size filters on listings are often wrong, so check the label in the photos and ask for flat measurements. [MoneySavingExpert Vinted tips](https://www.moneysavingexpert.com/team-blog/2022/11/vinted-buying-and-selling-tips)

## Sizes and fit

- Letter to EU: XS 34, S 36, M 38, L 40, XL 42. Common conversions: FR = EU + 2, IT = EU + 4, UK = EU − 28, US = EU − 32. Sources disagree; brand charts win. [size.ly conversion charts](https://www.size.ly/conversion-charts/international-size-charts-women)
- Zara tends to run small; Mango is close to EU sizing; H&M tends to run large. These are rules of thumb from size guides, not official statements. [Mango size guide](https://www.mangooutlet.com/se/en/size-guide)
- Height and weight alone pick the right size only about 60% of the time in studies; body measurements do better. [TU Delft, Applied Sciences 2022](https://research.tudelft.nl/files/134949911/applsci_12_10158.pdf)
- Armpit to armpit × 2 ≈ chest circumference (approximate). The most reliable method is comparing with a garment that already fits. [Printful: measuring flat](https://www.printful.com/uk/blog/how-to-measure-a-t-shirt)
- Petite usually means about 160 cm or shorter.

## Style

- Body shapes (hourglass, pear, apple, rectangle, inverted triangle) are styling conventions, not science; the app offers them as options. [Woman & Home](https://www.womanandhome.com/fashion/body-type-what-body-shape-am-i/)
- The 12-season colour analysis uses undertone, value, chroma and contrast. It's a styling convention, and in-person draping is more reliable than photos. [Sterling Style Academy](https://sterlingstyleacademy.com/what-is-12-seasonal-color-analysis-and-how-does-it-work/)
- Style essences (Kibbe families, Kitchener's essences) are vocabulary for describing a look. [The Concept Wardrobe](https://theconceptwardrobe.com/7-style-essences/complete-style-essences-guides)
- The stylist method: intake, then body and colour, then style keywords, then a wardrobe audit, then a capsule, then a gap-based shopping list, then a lookbook. A good buy goes with at least three owned pieces.

## Photos and AI

- Vision-language models label fashion attributes reasonably well without training (about 64% macro-F1 in a 2026 benchmark) but struggle to say when an attribute isn't visible. The prompts therefore tell Claude not to invent what it can't see. [arXiv 2601.15711](https://arxiv.org/html/2601.15711)

## Instagram

- Instagram's Basic Display API is gone. Reading other accounts officially needs a professional account plus a Meta app (Business Discovery). Logged-in scraping breaks Meta's terms. The app therefore uses handles Claude may already know, plus screenshots. [Meta Business Discovery](https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/business_discovery)
