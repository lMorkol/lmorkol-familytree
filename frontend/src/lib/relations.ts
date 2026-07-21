const RELATION_LABELS: Record<string, string> = {
  parent: "Родитель",
  child: "Ребёнок",
  spouse: "Супруг(а)",
  ex_spouse: "Бывший супруг(а)",
  adopted: "Усыновлённый",
  brother: "Брат",
  sister: "Сестра",
  grandmother: "Бабушка",
  grandfather: "Дедушка",
  grandchild: "Внук(внучка)",
  stepbrother: "Сводный брат",
  stepsister: "Сводная сестра",
};

export function getRelationLabel(type: string, myGender: string, relatedGender: string): string {
  if (type === "spouse") {
    if (myGender === "male") return relatedGender === "female" ? "Жена" : "Супруг(а)";
    if (myGender === "female") return relatedGender === "male" ? "Муж" : "Супруг(а)";
    return "Супруг(а)";
  }
  if (type === "ex_spouse") {
    if (myGender === "male") return relatedGender === "female" ? "Бывшая жена" : "Бывший супруг(а)";
    if (myGender === "female") return relatedGender === "male" ? "Бывший муж" : "Бывший супруг(а)";
    return "Бывший супруг(а)";
  }
  if (type === "parent") {
    if (relatedGender === "female") return "Мать";
    if (relatedGender === "male") return "Отец";
    return "Родитель";
  }
  if (type === "child") {
    if (relatedGender === "female") return "Дочь";
    if (relatedGender === "male") return "Сын";
    return "Ребёнок";
  }
  if (type === "grandmother") return "Бабушка";
  if (type === "grandfather") return "Дедушка";
  if (type === "grandchild") {
    if (relatedGender === "female") return "Внучка";
    if (relatedGender === "male") return "Внук";
    return "Внук(внучка)";
  }
  if (type === "brother" || type === "sister" || type === "sibling") {
    if (relatedGender === "female") return "Сестра";
    if (relatedGender === "male") return "Брат";
    return "Брат/Сестра";
  }
  if (type === "stepbrother") return "Сводный брат";
  if (type === "stepsister") return "Сводная сестра";
  if (type === "adopted") {
    if (relatedGender === "female") return "Усыновлённая";
    if (relatedGender === "male") return "Усыновлённый";
    return "Усыновлённый";
  }
  return RELATION_LABELS[type] || type;
}
