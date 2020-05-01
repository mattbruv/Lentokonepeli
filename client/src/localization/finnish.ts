import { Translation } from "./translation";

// Å, å
// Ä, ä
// Ö, ö

export const Finnish: Translation = {
  languageName: "suomi",

  language: "Kieli",
  settings: "Asetukset",
  showDebug: "Näytä vianetsintävalikko",

  name: "Nimi",
  team: "Tiimi",
  updateName: "Päivitä nimi",
  ping: "Ping",
  pingDescription:
    "Aika millisekunnissa ennen syötteesi saapumista palvelimelle.",
  connecting: "Yhdistetään pelipalvelimeen...",
  connectionError: `Yhteys pelipalvelimeen on suljettu.
Lataa web-sivu uudelleen muodostaaksesi yhteyden uudelleen.`,

  gameName: "Lentokonepeli",
  teamChooserTitle: "Valitse kumpien puolella lennät:",
  teamChooserDescription: `keskusvaltojen vai ympärysvaltojen
Kummallakin puolella on oma konevalikoimansa,
josta saat puolen valittuasi valita koneesi.
Keskimmäinen valinta arpoo puolesi`,
  planeAlbatrosName: "Albatros D.II",
  planeAlbatrosDescription: `Konekiväärillä varustettu
peruskone ilman erityisen
hyviä tai huonoja puolia.
Hyvä valinta aloittelijalle.`,
  planeFokkerName: "Fokker DR.I",
  planeFokkerDescription: `Legendaarinen kolmitaso.
Erittäin kettärä ja myös
mainio maksimilentokorkeus.`,
  planeSopwithName: "Sopwith Camel",
  planeSopwithDescription: `Erittäin ketterä.
ei suositella aloitteleville
lentäjille.`,
  planeBristolName: "Bristol F.2b",
  planeBristolDescription: `Sangen tulivoimaisella
konekiväärillä varustettu
kone. Hyvä valinta etenkin
aloitteleville lentäjille.`,
  planeJunkersName: "Junkers J.I",
  planeJunkersDescription: `Konekiväärin lisäksi
pommeilla varustettu,
erittäin kestävä, mutta
kömpelö kone.`,
  planeSalmsonName: "Salmson 2",
  planeSalmsonDescription: `Monipuolinen kaksitaso.
Konekiväärin lisäksa pommit.
Nopea ja vahvamoottorinen
kone, joskaan ei ketterä.`
};
