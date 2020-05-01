export interface Translation {
  /*** UI ***/
  languageName: string;

  language: string;
  settings: string;
  showDebug: string;

  team: string;
  name: string;
  updateName: string;
  ping: string;
  pingDescription: string;
  connecting: string;
  connectionError: string;

  /*** GAME ***/

  gameName: string;

  teamChooserTitle: string;
  teamChooserDescription: string;

  planeAlbatrosName: string;
  planeAlbatrosDescription: string;

  planeSopwithName: string;
  planeSopwithDescription: string;

  planeFokkerName: string;
  planeFokkerDescription: string;

  planeBristolName: string;
  planeBristolDescription: string;

  planeJunkersName: string;
  planeJunkersDescription: string;

  planeSalmsonName: string;
  planeSalmsonDescription: string;
}
