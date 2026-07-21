// ─────────────────────────────────────────────────────────────────
// BLIXIMSTRAAT NEWS / ARTICLES
// Add new articles here. The News pages read from this file.
// date format: "YYYY-MM-DD"
// cover images live in /Graphics/Articles/
// ─────────────────────────────────────────────────────────────────
import article1Cover from "../../Graphics/Articles/article1.png";
import article2Cover from "../../Graphics/Articles/article2.jpeg";
import article3Cover from "../../Graphics/Articles/bxm_jakkals.png";

export type NewsSegment = { text: string; href?: string };

export type NewsBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "richParagraph"; segments: NewsSegment[] }
  | { type: "quote"; text: string };

export type NewsArticle = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  cover: string;
  coverCaption?: string;
  body: NewsBlock[];
};

const BS = "https://www.youtube.com/channel/UCaRgHj3J8RjDuS_eyZXdepA";
const JV = "https://www.jakkalsvibes.com/index.html";
const WWLJ = "https://youtu.be/NWkKcvO1tQU?si=EBT8_HFDr0lolc8G";
const HS = "https://youtu.be/_T9Mo5N2drw?si=4xuzKF2x-xH3ovb9";

export const NEWS: NewsArticle[] = [
  {
    slug: "kunstenaars-mekaar-inspireer-blixim-straat-jakkals-vibes",
    title: "Wanneer kunstenaars mekaar inspireer: Blixim Straat en Jakkals Vibes se suksesvolle liedjie-uitruiling",
    date: "2026-07-21",
    excerpt:
      "Wat gebeur wanneer twee kunstenaars met hul eie unieke klank besluit om vir 'n oomblik in mekaar se musikale wêreld in te stap? Vir Blixim Straat en Jakkals Vibes het die antwoord gelei tot byna 190 000 YouTube-views in drie weke.",
    cover: article3Cover,
    body: [
      {
        type: "paragraph",
        text: "Wat gebeur wanneer twee kunstenaars met hul eie unieke klank besluit om vir 'n oomblik in mekaar se musikale wêreld in te stap?",
      },
      {
        type: "richParagraph",
        segments: [
          { text: "Vir " },
          { text: "Blixim Straat", href: BS },
          { text: " en " },
          { text: "Jakkals Vibes", href: JV },
          { text: " het die antwoord gelei tot 'n besondere samewerking—en een wat luisteraars duidelik geniet het." },
        ],
      },
      {
        type: "paragraph",
        text: "Die idee was eenvoudig: elke kunstenaar kies een van die ander se bekende liedjies en gee dit 'n nuwe lewe deur dit met sy eie klank, styl en gevoel te herinterpreteer.",
      },
      {
        type: "richParagraph",
        segments: [
          { text: "Jakkals Vibes", href: JV },
          { text: " het " },
          { text: "Blixim Straat", href: BS },
          { text: " se \"" },
          { text: "Wakker Word Langs Jou", href: WWLJ },
          { text: "\" gekies, terwyl " },
          { text: "Blixim Straat", href: BS },
          { text: " sy eie weergawe van " },
          { text: "Jakkals Vibes", href: JV },
          { text: " se treffer \"" },
          { text: "Heeltemal Stom", href: HS },
          { text: "\" geskep het." },
        ],
      },
      { type: "paragraph", text: "Die doel was nooit om die oorspronklike liedjies te vervang nie." },
      {
        type: "paragraph",
        text: "Dit was eerder om te wys hoe dieselfde lied heeltemal anders kan voel wanneer dit deur die kreatiewe wêreld van 'n ander kunstenaar beweeg.",
      },
      { type: "heading", text: "Twee liedjies. Twee style. Een gedeelde liefde vir musiek." },
      {
        type: "richParagraph",
        segments: [
          { text: "Jakkals Vibes", href: JV },
          { text: " het \"" },
          { text: "Wakker Word Langs Jou", href: WWLJ },
          { text: "\" geneem en dit deur sy eie musikale lens geïnterpreteer, terwyl die hart van die oorspronklike lied steeds herkenbaar gebly het." },
        ],
      },
      {
        type: "richParagraph",
        segments: [
          { text: "Blixim Straat", href: BS },
          { text: " het dieselfde gedoen met \"" },
          { text: "Heeltemal Stom", href: HS },
          { text: "\"—'n lied wat reeds sterk met " },
          { text: "Jakkals Vibes", href: JV },
          { text: " se klank en gehoor verbind word—en dit binne die herkenbare energie en gevoel van " },
          { text: "Blixim Straat", href: BS },
          { text: " herverbeel." },
        ],
      },
      {
        type: "paragraph",
        text: "Die resultaat was twee weergawes wat nie met die oorspronklikes probeer kompeteer nie, maar eerder langs hulle kan bestaan.",
      },
      { type: "heading", text: "Die luisteraars het die laaste woord gehad" },
      {
        type: "paragraph",
        text: "Sedert die twee liedjies ongeveer drie weke gelede vrygestel is, het die samewerking sterk ondersteuning ontvang.",
      },
      {
        type: "richParagraph",
        segments: [
          { text: "Jakkals Vibes", href: JV },
          { text: " se weergawe van \"" },
          { text: "Wakker Word Langs Jou", href: WWLJ },
          { text: "\" het reeds meer as 127 000 YouTube-views bereik, terwyl " },
          { text: "Blixim Straat", href: BS },
          { text: " se weergawe van \"" },
          { text: "Heeltemal Stom", href: HS },
          { text: "\" meer as 61 000 YouTube-views aangeteken het." },
        ],
      },
      {
        type: "paragraph",
        text: "Saam is die twee herinterpretasies dus reeds byna 190 000 keer op YouTube gekyk—in net drie weke.",
      },
      { type: "paragraph", text: "Maar soos met enige musiekprojek vertel die syfers net 'n deel van die storie." },
      {
        type: "paragraph",
        text: "Die ware sukses lê ook by die luisteraars van beide kunstenaars wat bereid was om iets nuuts 'n kans te gee.",
      },
      {
        type: "richParagraph",
        segments: [
          { text: "Jakkals Vibes", href: JV },
          { text: " se gehoor kon 'n " },
          { text: "Blixim Straat", href: BS },
          { text: "-lied deur 'n bekende klank ontdek, terwyl " },
          { text: "Blixim Straat", href: BS },
          { text: " se luisteraars op dieselfde manier aan een van " },
          { text: "Jakkals Vibes", href: JV },
          { text: " se bekende liedjies blootgestel is." },
        ],
      },
      { type: "paragraph", text: "So het twee musiekgemeenskappe vir 'n oomblik bymekaargekom." },
      { type: "heading", text: "Samewerking eerder as kompetisie" },
      {
        type: "paragraph",
        text: "In 'n musiekbedryf waar kunstenaars maklik as kompetisie teenoor mekaar geplaas kan word, vertel hierdie projek 'n ander storie.",
      },
      { type: "paragraph", text: "Een van wedersydse respek." },
      {
        type: "paragraph",
        text: "Die idee dat een kunstenaar deur 'n ander geïnspireer kan word sonder om sy eie identiteit te verloor.",
      },
      {
        type: "paragraph",
        text: "En dat daar ruimte is vir verskillende klanke, verskillende interpretasies en verskillende gehore om saam te bestaan.",
      },
      {
        type: "richParagraph",
        segments: [
          { text: "Blixim Straat", href: BS },
          { text: " en " },
          { text: "Jakkals Vibes", href: JV },
          { text: " se liedjie-uitruiling wys dat samewerking nie altyd beteken dat twee kunstenaars saam op dieselfde lied hoef te wees nie." },
        ],
      },
      {
        type: "paragraph",
        text: "Soms beteken dit bloot om vir iemand anders se kreatiwiteit genoeg respek te hê om te sê:",
      },
      { type: "quote", text: "\"Ek wonder hoe hierdie lied deur my wêreld sou klink?\"" },
      {
        type: "paragraph",
        text: "Die antwoord het hierdie keer twee nuwe weergawes, twee gehore wat nader aan mekaar beweeg het en byna 190 000 YouTube-views in drie weke opgelewer.",
      },
      {
        type: "paragraph",
        text: "Maar dalk is die belangrikste resultaat iets wat nie in 'n statistiek gemeet kan word nie:",
      },
      {
        type: "quote",
        text: "Twee kunstenaars wat mekaar se musiek gevier het—en luisteraars wat saam met hulle deel geword het van die ervaring.",
      },
    ],
  },
  {
    slug: "van-sonlandpark-tot-30-miljoen-streams",
    title: "Van Sonlandpark tot meer as 30 miljoen streams – die verhaal van Blixim Straat",
    date: "2026-07-20",
    excerpt:
      "Toe Pieter Daniël Groesbeek in 2022 begin werk het aan die idee van Blixim Straat, was daar geen waarborg dat dit ooit sou werk nie. Vandag het hy meer as 30 miljoen globale streams.",
    cover: article2Cover,
    coverCaption: "'n Foto van Pieter as frontman van The Clozure in 2010. Pieter se broer Armand, as drummer.",
    body: [
      {
        type: "paragraph",
        text: "Toe Pieter Daniël Groesbeek in 2022 die eerste keer begin werk het aan die idee van Blixim Straat, was daar geen waarborg dat dit ooit sou werk nie.",
      },
      {
        type: "paragraph",
        text: "Live optredes het moeiliker geraak, en hy het besef dat die manier waarop mense nuwe musiek ontdek, besig was om te verander. Hy het begin navorsing doen oor platforms soos TikTok en met nuwe KI-musiektegnologieë geëksperimenteer om te verstaan hoe dit kreatiwiteit kan ondersteun. Vir Pieter was dit egter nog altyd net 'n hulpmiddel—die liedjies, emosies en stories moes steeds uit sy eie pen kom.",
      },
      {
        type: "paragraph",
        text: "Vir meer as 'n jaar het hy navorsing gedoen, lirieke geskryf, met verskillende style geëksperimenteer en stadig begin bou aan die klank wat later Blixim Straat sou word.",
      },
      { type: "paragraph", text: "Byna niks uit daardie vroeë tyd is gepubliseer nie." },
      { type: "paragraph", text: "Hy het gewag totdat die musiek reg gevoel het." },
      {
        type: "paragraph",
        text: "Op 7 Augustus 2024 is die eerste Blixim Straat-liedjies amptelik vrygestel.",
      },
      {
        type: "paragraph",
        text: "Wat daarna gebeur het, sou egter nooit deur een persoon alleen moontlik gewees het nie.",
      },
      {
        type: "paragraph",
        text: "Vandag het Blixim Straat meer as 30 miljoen globale streams en views op Spotify, YouTube en Apple Music opgebou, met miljoene luister- en kyksessies wat elke maand bygevoeg word.",
      },
      {
        type: "paragraph",
        text: "Maar agter elkeen van daardie syfers is daar iemand wat gekies het om te luister.",
      },
      { type: "paragraph", text: "Iemand wat 'n lied gedeel het." },
      { type: "paragraph", text: "Iemand wat dit vir 'n vriend gespeel het." },
      { type: "paragraph", text: "Iemand wat 'n video daarmee gemaak het." },
      { type: "paragraph", text: "Of iemand wat net weer op \"play\" gedruk het." },
      {
        type: "paragraph",
        text: "Vir Pieter, wat in Sonlandpark, Vereeniging grootgeword het en reeds op 13-jarige ouderdom kitaar begin speel het, is dit iets wat moeilik is om in woorde vas te vang.",
      },
      {
        type: "paragraph",
        text: "\"Ek het nog altyd daarvan gedroom dat mense eendag my musiek sal geniet,\" sê Pieter. \"Maar ek kon my nooit voorstel hoeveel mense uiteindelik deel van hierdie reis sou word nie. Elke persoon wat luister, deel of by 'n show opdaag, het gehelp om Blixim Straat te maak wat dit vandag is.\"",
      },
      {
        type: "paragraph",
        text: "Een van die besonderse mylpale op hierdie reis was \"Sy is op haar mooiste in my geskeurde T-hemp\", wat vir ses opeenvolgende weke op Spotify se Viral Top 50 verskyn het en daarna nog maande op die ranglys gebly het.",
      },
      { type: "paragraph", text: "Die lied het sy eie lewe begin kry." },
      { type: "paragraph", text: "Mense het dit ontdek, gedeel en hul eie betekenis daarin gevind." },
      {
        type: "paragraph",
        text: "En dit is dalk een van die mooiste dele van musiek: 'n kunstenaar kan 'n lied skryf, maar wanneer dit eers die wêreld ingaan, word dit ook deel van die mense wat daarna luister.",
      },
      { type: "paragraph", text: "Die ondersteuning het ook verder as streaming gegroei." },
      {
        type: "paragraph",
        text: "Blixim Straat het reeds verskeie live vertonings gelewer en tree steeds by feeste en geleenthede op. Elke organiseerder wat 'n verhoog beskikbaar gestel het en elke persoon wat voor daardie verhoog kom staan het, het deel geword van die storie.",
      },
      { type: "paragraph", text: "Tradisionele media het ook 'n waardevolle rol gespeel." },
      {
        type: "paragraph",
        text: "Onderhoude met Gold FM, Radio Sonder Grense (RSG) en Groot FM het nuwe geleenthede geskep om die musiek en die storie agter Blixim Straat met ander gehore te deel.",
      },
      {
        type: "paragraph",
        text: "Pieter dien ook as beoordelaar vir die FAK se Skryf'it-kompetisie, waar hy ná ongeveer drie dekades van eie ervaring met musiek en liedjieskryf nou ook die geleentheid kry om deel te wees van ander kunstenaars en liedjieskrywers se kreatiewe reis.",
      },
      {
        type: "paragraph",
        text: "Blixim Straat se verhaal is daarom nie net 'n verhaal oor een kunstenaar wat 'n sekere aantal streams bereik het nie.",
      },
      {
        type: "paragraph",
        text: "Dit is 'n verhaal oor wat kan gebeur wanneer musiek mense bereik.",
      },
      { type: "paragraph", text: "Wanneer luisteraars ondersteun." },
      { type: "paragraph", text: "Wanneer creators skep." },
      { type: "paragraph", text: "Wanneer radiostasies en mediaplatforms 'n deur oopmaak." },
      { type: "paragraph", text: "Wanneer organiseerders 'n verhoog bied." },
      { type: "paragraph", text: "En wanneer mense besluit om saam op die reis te gaan." },
      { type: "paragraph", text: "Meer as 30 miljoen streams en views is 'n ongelooflike mylpaal." },
      {
        type: "paragraph",
        text: "Maar vir Pieter lê die grootste waarde steeds in die mense agter daardie syfers.",
      },
      {
        type: "paragraph",
        text: "Van Sonlandpark in Vereeniging tot luisteraars regoor die wêreld het elkeen wat deel geword het van Blixim Straat se musiek ook deel geword van die storie.",
      },
      {
        type: "paragraph",
        text: "En vir Blixim Straat is hierdie mylpaal nie net 'n eindbestemming nie.",
      },
      { type: "paragraph", text: "Dit is 'n geleentheid om dankie te sê." },
      { type: "paragraph", text: "En om saam te kyk wat die volgende hoofstuk bring." },
    ],
  },
  {
    slug: "kunstenaar-wat-miljoene-streams-bou",
    title: "Die kunstenaar wat miljoene streams bou, sonder om op tradisionele radio staat te maak",
    date: "2026-07-11",
    excerpt:
      "In minder as agt maande het Blixim Straat meer as 30 miljoen globale streams en views opgebou — sonder 'n groot platemaatskappy.",
    cover: article1Cover,
    body: [
      { type: "paragraph", text: "Elke kunstenaar se pad lyk anders." },
      {
        type: "paragraph",
        text: "Vir Blixim Straat het daardie pad begin met 'n liefde vir musiek, jare se liedjieskryf en 'n eenvoudige hoop: dat die musiek iewers iemand sal bereik wat iets daarin herken.",
      },
      {
        type: "paragraph",
        text: "Wat daarna gebeur het, het selfs vir Pieter Daniël Groesbeek, die man agter Blixim Straat, verras.",
      },
      {
        type: "paragraph",
        text: "In 'n relatief kort tyd het Blixim Straat meer as 30 miljoen globale streams en views oor Spotify, YouTube en Apple Music opgebou.",
      },
      {
        type: "paragraph",
        text: "Maar agter elkeen van daardie syfers is daar iets baie belangriker:",
      },
      { type: "paragraph", text: "'n Mens wat gekies het om te luister." },
      { type: "heading", text: "Meer as net 'n syfer" },
      { type: "paragraph", text: "Oor die afgelope 365 dae het Blixim Straat:" },
      {
        type: "list",
        items: [
          "Meer as 12,4 miljoen Spotify-streams behaal.",
          "Meer as 17,2 miljoen YouTube-views ontvang.",
          "Meer as 2,2 miljoen Apple Music-streams opgebou.",
        ],
      },
      {
        type: "paragraph",
        text: "Hierdie syfers is vir Blixim Straat 'n ongelooflike mylpaal, maar ook 'n herinnering aan hoeveel mense deel geword het van die reis.",
      },
      {
        type: "paragraph",
        text: "Elke stream, elke playlist add, elke share, elke kommentaar en elke persoon wat 'n lied vir iemand anders gespeel het, het gehelp om die musiek verder te dra.",
      },
      { type: "paragraph", text: "Hierdie is dus nie net 'n Blixim Straat-mylpaal nie." },
      { type: "paragraph", text: "Dit behoort ook aan elke persoon wat deel geword het van die storie." },
      { type: "heading", text: "Wanneer 'n lied sy eie pad vind" },
      {
        type: "paragraph",
        text: "Een van die besonderse oomblikke op hierdie reis was toe \"Sy is op haar mooiste in my geskeurde T-Shirt\" organies momentum begin kry het.",
      },
      {
        type: "paragraph",
        text: "Vroeg in November 2025 het Jakkal Vibes vir Blixim Straat laat weet dat daardie die lied het op Spotify se Viral Top 50 verskyn en daarna nog vir maande op die ranglys gebly.",
      },
      { type: "paragraph", text: "Dit was nie iets wat vooraf beplan kon word nie." },
      {
        type: "paragraph",
        text: "Mense het die lied ontdek, geluister, gedeel en weer daarna teruggekeer.",
      },
      {
        type: "paragraph",
        text: "En dit is dalk een van die mooiste dinge van musiek: 'n kunstenaar kan 'n lied skryf en vrystel, maar van daardie oomblik af behoort dit ook aan die mense wat hul eie herinneringe en betekenis daarin vind.",
      },
      { type: "heading", text: "Van die skerm na die verhoog" },
      { type: "paragraph", text: "Die ondersteuning het ook begin oorspoel na live optredes." },
      {
        type: "paragraph",
        text: "Blixim Straat het reeds 10 live vertonings voltooi, met nog sewe opkomende vertonings op die kalender.",
      },
      {
        type: "paragraph",
        text: "Om mense voor 'n verhoog te sien saamdans en woorde saam te hoor sing wat eens net as lirieke op 'n bladsy bestaan het, bly vir Pieter een van die grootste voorregte van hierdie reis.",
      },
      {
        type: "paragraph",
        text: "Elke persoon wat 'n kaartjie koop, voor die verhoog kom staan, 'n video neem of eenvoudig saam met 'n lied sing, is deel van wat Blixim Straat vandag geword het.",
      },
      { type: "heading", text: "'n Gemeenskap wat die musiek verder dra" },
      {
        type: "paragraph",
        text: "Sosiale media, en veral TikTok, het 'n besondere rol in die groei van Blixim Straat gespeel.",
      },
      {
        type: "paragraph",
        text: "Met meer as 40 000 TikTok-volgers het daar 'n gemeenskap rondom die musiek ontstaan wat veel groter geword het as net een kunstenaar of een profiel.",
      },
      {
        type: "paragraph",
        text: "Creators, ondersteuners en gewone luisteraars het die musiek gebruik om hul eie stories te vertel, video's te maak, te dans en kreatiewe inhoud te skep.",
      },
      {
        type: "paragraph",
        text: "Mense en platforms soos Stream Bean Radio, Jakkals Vibes, en talle ander creators en gemeenskapslede het op verskillende maniere gehelp om die musiek by nuwe ore uit te bring.",
      },
      { type: "paragraph", text: "Sommige het 'n lied gedeel." },
      { type: "paragraph", text: "Ander het 'n video gemaak." },
      { type: "paragraph", text: "Party het net vir 'n vriend gesê: \"Luister gou hierna.\"" },
      { type: "paragraph", text: "Elke klein gebaar het deel geword van iets groter." },
      { type: "heading", text: "Ook dankbaar vir tradisionele media" },
      {
        type: "paragraph",
        text: "Hoewel 'n groot deel van Blixim Straat se groei digitaal plaasgevind het, het radio en tradisionele media ook 'n waardevolle rol in die reis gespeel.",
      },
      {
        type: "paragraph",
        text: "Blixim Straat het die geleentheid gehad om onderhoude met Gold FM, Radio Sonder Grense (RSG) en Groot FM te doen.",
      },
      {
        type: "paragraph",
        text: "Elke radiostasie, aanbieder, DJ, joernalis en mediaplatform wat tyd gemaak het om na die storie of die musiek te luister, het gehelp om Blixim Straat aan 'n nuwe gehoor bekend te stel.",
      },
      {
        type: "paragraph",
        text: "Pieter dien ook as beoordelaar vir die FAK se Skryf'it-kompetisie, 'n geleentheid om, ná ongeveer drie dekades van eie ervaring met musiek en liedjieskryf, ook deel te wees van ander mense se kreatiewe reis.",
      },
      { type: "heading", text: "Daar is plek vir almal" },
      { type: "paragraph", text: "Die musiekbedryf verander voortdurend." },
      {
        type: "paragraph",
        text: "Radio, televisie, streaming, sosiale media, live shows en creators speel vandag elkeen 'n rol in hoe musiek ontdek en gedeel word.",
      },
      { type: "paragraph", text: "Dit hoef nie die een óf die ander te wees nie." },
      {
        type: "paragraph",
        text: "Blixim Straat se storie wys eerder wat moontlik kan gebeur wanneer al hierdie wêrelde bymekaar kom, wanneer 'n radiostasie 'n lied speel, 'n creator dit deel, iemand dit op Spotify ontdek, 'n vriend dit in die kar speel en 'n gehoor later saam voor 'n verhoog staan.",
      },
      { type: "paragraph", text: "Meer as 30 miljoen streams en views is 'n ongelooflike getal." },
      {
        type: "paragraph",
        text: "Maar vir Pieter Daniël Groesbeek lê die ware waarde nie net in die getal nie.",
      },
      { type: "paragraph", text: "Dit lê in elke mens wat geluister het." },
      { type: "paragraph", text: "Elke creator wat geskep het." },
      { type: "paragraph", text: "Elke radiostasie wat 'n deur oopgemaak het." },
      { type: "paragraph", text: "Elke organiseerder wat 'n verhoog beskikbaar gestel het." },
      { type: "paragraph", text: "Elke medekunstenaar wat ondersteuning gewys het." },
      {
        type: "paragraph",
        text: "En elke persoon wat besluit het om saam met Blixim Straat op hierdie reis te gaan.",
      },
      { type: "paragraph", text: "Hierdie mylpaal behoort aan julle ook." },
      { type: "paragraph", text: "En daarvoor kan Blixim Straat net een ding sê:" },
      { type: "paragraph", text: "Dankie." },
    ],
  },
];
