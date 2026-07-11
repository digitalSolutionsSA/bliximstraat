// ─────────────────────────────────────────────────────────────────
// BLIXIMSTRAAT NEWS / ARTICLES
// Add new articles here. The News pages read from this file.
// date format: "YYYY-MM-DD"
// cover images live in /Graphics/Articles/
// ─────────────────────────────────────────────────────────────────
import article1Cover from "../../Graphics/Articles/article1.png";

export type NewsBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] };

export type NewsArticle = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  cover: string;
  body: NewsBlock[];
};

export const NEWS: NewsArticle[] = [
  {
    slug: "kunstenaar-wat-miljoene-streams-bou",
    title: "Die kunstenaar wat miljoene streams bou, sonder om op tradisionele radio staat te maak",
    date: "2026-07-11",
    excerpt:
      "In minder as agt maande het Blixim Straat meer as 30 miljoen globale streams en views opgebou — sonder 'n groot platemaatskappy.",
    cover: article1Cover,
    body: [
      {
        type: "paragraph",
        text: "Terwyl baie kunstenaars steeds hul sukses meet aan radio-speeltyd en televisie-blootstelling, vertel Blixim Straat se storie 'n heel ander verhaal.",
      },
      {
        type: "paragraph",
        text: "In minder as agt maande het die onafhanklike Afrikaanse EDM-projek van Pieter Daniël Groesbeek meer as 30 miljoen globale streams en views oor Spotify, YouTube en Apple Music opgebou. Dit plaas Blixim Straat onder die suksesvolste onafhanklike Afrikaanse digitale kunstenaars van die afgelope jaar.",
      },
      {
        type: "paragraph",
        text: "Die indrukwekkendste deel van hierdie prestasie is dat dit bereik is sonder die ondersteuning van 'n groot platemaatskappy en met relatief beperkte tradisionele radio-blootstelling.",
      },
      { type: "heading", text: "Die syfers vertel die storie" },
      { type: "paragraph", text: "Oor die afgelope 365 dae het Blixim Straat:" },
      {
        type: "list",
        items: [
          "Meer as 12,4 miljoen Spotify-streams behaal.",
          "Meer as 17,2 miljoen YouTube-views ontvang.",
          "Meer as 2,2 miljoen Apple Music-streams opgelewer.",
        ],
      },
      {
        type: "paragraph",
        text: "Saam verteenwoordig dit meer as 30 miljoen globale luister- en kyksessies, 'n mylpaal wat in die Afrikaanse KI-musiekruimte voorheen slegs deur Jakkals Vibes bereik is.",
      },
      { type: "heading", text: "'n Treffer wat sy eie lewe gekry het" },
      {
        type: "paragraph",
        text: "Een van Blixim Straat se bekendste treffers, \"Sy is op haar mooiste in my geskeurde T-shirt\", het organies momentum opgebou en vir ses opeenvolgende weke op Spotify se South Africa Viral Top 50 verskyn. Die lied het daarna nog vir ongeveer drie maande op die ranglys gebly. Die Viral-kaarte het liedjies uitgelig wat vinnig aan gewildheid en ontdekking gewen het, eerder as bloot die meeste totale streams.",
      },
      { type: "heading", text: "Die verhoog vertel dieselfde storie" },
      {
        type: "paragraph",
        text: "Digitale sukses beteken min as dit nie na die verhoog oorgedra kan word nie.",
      },
      {
        type: "paragraph",
        text: "Blixim Straat het reeds 10 live optredes voltooi, met nog sewe bevestigde vertonings op die kalender. Volgens terugvoer van verskeie organiseerders is Blixim Straat gereeld een van die kunstenaars wat die grootste skares na die verhoog lok, met gehore wat die liedjies woord vir woord saam sing.",
      },
      { type: "heading", text: "'n Gemeenskap wat aanhou groei" },
      {
        type: "paragraph",
        text: "Op sosiale media groei die gemeenskap steeds vinnig.",
      },
      {
        type: "paragraph",
        text: "Met meer as 40 000 TikTok-volgers en miljoene maandelikse streams bereik Blixim Straat luisteraars lank voordat hulle die kunstenaar op tradisionele media ontdek.",
      },
      { type: "heading", text: "Erkenning uit die bedryf" },
      {
        type: "paragraph",
        text: "Die groei het reeds gelei tot onderhoude op Gold FM, Radio Sonder Grense (RSG) en Groot FM.",
      },
      {
        type: "paragraph",
        text: "Pieter Daniël Groesbeek dien ook as beoordelaar vir die FAK se \"Skryf'it\"-kompetisie, waar hy sy drie dekades se ervaring as liedjieskrywer gebruik om nuwe Afrikaanse talent te help ontwikkel.",
      },
      { type: "heading", text: "Die musiekbedryf verander" },
      {
        type: "paragraph",
        text: "Vir dekades was radio die primêre maatstaf van sukses.",
      },
      {
        type: "paragraph",
        text: "Vandag ontdek miljoene luisteraars nuwe musiek deur streaming-platforms, aanbevelings en sosiale media. Selfs Suid-Afrika se amptelike digitale musiekkaarte word saamgestel uit streaming-data eerder as slegs radio-speeltyd.",
      },
      {
        type: "paragraph",
        text: "Blixim Straat se groei wys dat 'n onafhanklike kunstenaar vandag 'n nasionale én internasionale gehoor kan bou deur konsekwent kwaliteit musiek vry te stel en 'n lojale gemeenskap rondom sy handelsmerk te ontwikkel.",
      },
      {
        type: "paragraph",
        text: "Vir Pieter Daniël Groesbeek is hierdie 30 miljoen streams nie die eindpunt nie, dit is bloot die begin van die volgende hoofstuk.",
      },
    ],
  },
];
