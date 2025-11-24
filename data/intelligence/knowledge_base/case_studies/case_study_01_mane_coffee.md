# Case Study: Mane Coffee - Multi-Item Quote & Blank Selection

## 1. Customer Context
*Who is this customer? What do we need to know about them to serve them well?*

*   **Name/Company:** Daniel Karram, Mane Coffee (Boutique coffee shop in Boca Raton).
*   **Customer Type:** "Flaky" Regular. High potential but historically indecisive.
*   **History/Relationship:** Last ordered in 2021. Has placed multiple quote requests since but hasn't locked in.
*   **Key Preferences:** Likes "Comfort Colors" (vintage/soft feel). Vague on specifics (needs guidance).
*   **Operational Note:** "Just get the order through the door" - prioritize speed and "good enough" ballparks over agonizing precision for this specific client to avoid burnout.

## 2. The Trigger (Input)
*The raw email or request received.*

**Subject:** Mane Coffee
**Body:**
```text
Hey dude

Attached are some files and concepts we are considering.

A couple questions i have. 

Do you guys do custom little tags? Per the hat/ hoodie / tees. Considering adding them as a nice touch depending on price.

For the hats I am looking for embroidery.

For socks, shirts and hoodies all screen printed with the exception of the grey shirt with black writing, would love for that to be embroidered.

Also looking for a black on black tote.

Will realistically be printing a couple hundred items total

I look forward to hearing from you guys and seeing what we can do.

As far as blanks i really like comfort colors but are open to ideas or suggestions

Thanks so much!
-Dan
```

## 3. Analysis & Decision Making
*How should an expert rep think about this?*

*   **Intent Detection:** Customer wants a "collection" but is vague on details. Needs expert curation of blanks to match his mockups.
*   **Product Strategy (The "Blank" Selection):**
    *   **Consolidation:** Try to keep everything within **AS Colour** brand to save on shipping (free shipping >$500) and ensure consistent quality/sizing.
    *   **Hats:** Mockups look like *Otto 18-772* (colors match), but *AS Colour Access Cap* is better quality. **Decision:** Suggest AS Colour for quality/shipping, but link Otto as the "exact color match" alternative.
    *   **Hoodies:** *AS Colour Relax Hood* (Ink Blue & Ecru) matches the vibe perfectly.
    *   **Tees:** Customer asked for Comfort Colors, but we want to keep it AS Colour. **Decision:** *AS Colour Staple Tee* ($5.40 cost) is the best balance of quality/price. *Heavy Faded* is closer to Comfort Colors but too expensive ($10+).
    *   **Socks:** *AS Colour Relax Socks*. Note: Colors might not match mockups exactly.
    *   **Totes:** *AS Colour Carrie Tote*. Black on Black.
*   **Decoration Strategy:**
    *   **"Custom Tags" (Woven Labels):** We don't do this in-house. It's outsourced. **Decision:** Be transparent. It's expensive ($3/ea + label cost). Most clients skip it.
    *   **Embroidery:** <4000 stitches. 50pc minimum recommended.
*   **Pricing Strategy:**
    *   **Blanks:** Cost + 30% markup.
    *   **Print/Embroidery:** Use "Platinum Pricelist 35".
    *   **Heuristic for "Flaky" Clients:** Don't spend hours on a perfect quote. Use "Ballpark" numbers for the tees ($11-$14) to move fast.

## 4. The Response (Output)
*The ideal response we want the LLM to generate.*

**Subject:** Re: Mane Coffee
**Body:**
```text
Hey Dan,

Good to hear from you! happy to help bring together a collection for Mane this holiday season

Here is the breakdown and my recommendations to get this moving:

**1. Custom Tags**
We can make these, but just so you know, we have to outsource the sewing. It’s usually about $3.00 each for sewing, plus the cost of the labels. The price can add up fast, so most clients skip this unless they really want that premium retail touch. Let me know if you’d still like a quote.

**2. Blank Recommendations**
*   **Hats:** Your mockups look exactly like the **Otto 18-772** (Low Profile Dad Hat), which has those specific colors. However, I'd recommend the **AS Colour Access Cap** for better quality/fit, though their color palette is more limited.
    *   Here's AS Colours' full range of Headwear: [Link](https://ascolour.com/headwear/)
*   **Hoodies:** I think the **AS Colour Relax Hood** is perfect for this. I think the colors **Ink Blue & Ecru** are what you are looking for.
*   **Tees:** You mentioned Comfort Colors, but to keep everything cohesive (and cost-effective), I recommend the **AS Colour Staple Tee**. It’s a premium mid-weight shirt. The "Heavy Faded" tee is a garment dye (similar faded tee closer to Comfort Colors but practically double the price).
*   **Totes:** Id reccomend the **AS Colour Carrie Tote**. We can do the black on black look, id also reccomend printing the logo on both sides for maximum brand visibility.
*   **Socks:** **AS Colour Relax Socks** (Note: if you can wait 2-3 months, and are OK to order 200+ pairs we can get these overseas at a more cost effective price per unit).

**3. Preliminary Pricing (Based on ~50pcs per style)**

*   **Hats (Embroidery):** ~$12.00/ea
*   **Hoodies (Screen Print):** ~$35.00/ea (Front + Back print)
*   **Totes (2-sided Print):** ~$13.50/ea
*   **Tees (Screen Print):** ~$14.00/ea (White/Navy)
*   **Grey Tees (Embroidery):** ~$11.00/ea

*Note: These are estimated based on 50 units per style. If we go lower, price goes up.*

**Next Steps:**
If these ballparks work for you, let me know which specific blank colors you want to lock in from the AS Colour links, and I'll generate the official invoice.
```

## 5. Key Insights for Training
*   **The "Consolidation" Heuristic:** Always try to group items to a single vendor (like AS Colour) to save on shipping/logistics, even if the customer asks for a different brand (Comfort Colors), *unless* they are adamant.
*   **The "Flaky Client" Protocol:** If a client has a history of ghosting, do not spend 2 hours on a line-item quote. Provide confident "Ballpark" estimates first to gauge interest.
*   **Transparency on Add-ons:** For "Custom Tags" (sewing), immediately flag the high cost/outsourcing nature to manage expectations.
*   **Visual vs. Quality Trade-off:** Sometimes the "cheaper" hat (Otto) matches the *look* (colors) better than the "premium" hat (AS Colour). Present both: one for the *look*, one for the *quality*.
