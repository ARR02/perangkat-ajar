export interface CPElement {
  element: string;
  capaianPembelajaran: string;
}

export interface CurriculumMasterData {
  id: string;
  subject: string;
  phase: string;
  elements: CPElement[];
  sourceCitation: string;
  version: number;
}
