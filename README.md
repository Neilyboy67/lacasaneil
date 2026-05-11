# La Casa Neil

Holiday rental booking site for La Casa Neil — a 2-bedroom apartment in Calahonda, Mijas, Costa del Sol, Spain.

- Live site: https://lacasaneil.com (once domain is connected)
- Source images, copy and reviews adapted from the [original Airbnb listing](https://www.airbnb.co.uk/rooms/40308509).

## Editing

The whole site is a single `index.html` file with embedded CSS/JS. Just edit and commit.

- Photos live in `images/`
- Availability calendar pulls live from Airbnb iCal (see `ICAL_URL` in the script tag)
- Enquiry form posts to [FormSubmit.co](https://formsubmit.co/) and emails Neil

## Local preview

Open `index.html` directly in a browser, or run `python3 -m http.server` from this directory.
