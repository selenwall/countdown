# ⏳ Nedräknaren

En enkel, mobilanpassad hemsida som räknar ner dagarna till din nästa resa eller händelse.

## Funktioner

- **Välj datum** att räkna ner till.
- **Skriv vad** du räknar ner till (t.ex. en resa).
- **Välj tema** – Solresa, Skidresa, Fotbollsläger, Födelsedag, Kalas, Konsert, Jul eller Äventyr. Varje tema har egen färg och emoji.
- **Live-nedräkning** med dagar, timmar, minuter och sekunder.
- **Dela** nedräkningen med kompisar eller familj via en länk (använder telefonens delningsmeny, annars kopieras länken).
- **Sparas automatiskt** på din enhet så att du kan komma tillbaka till dina nedräkningar.
- Byggd mobile-first, men funkar lika bra i datorns webbläsare.

## Använda lokalt

Det är en helt statisk sida – inga beroenden eller byggsteg.

```bash
# öppna index.html direkt, eller kör en enkel server:
python3 -m http.server 8000
# besök sedan http://localhost:8000
```

## Hur delning fungerar

Hela nedräkningen (titel, datum och tema) kodas in i länkens slut (`#c=...`).
Det betyder att den som öppnar länken ser exakt samma nedräkning – utan att
någon server eller databas behövs.

## Filer

- `index.html` – sidans struktur
- `styles.css` – design och teman
- `app.js` – nedräkningslogik, teman, delning och sparning
