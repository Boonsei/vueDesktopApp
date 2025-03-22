export function parseNumber(numberString) {
  console.log(numberString);
  numberString = numberString.trim();

  if (numberString.endsWith(",") || numberString.endsWith(".")) {
    numberString = numberString.slice(0, -1);
  }

  if (numberString.includes(".") && numberString.includes(",")) {
    // Wenn sowohl Punkte als auch Kommas vorhanden sind
    if (numberString.lastIndexOf(",") > numberString.lastIndexOf(".")) {
      numberString = numberString.replace(/\./g, "").replace(",", ".");
    } else {
      numberString = numberString.replace(/,/g, "");
    }
  } else if (numberString.includes(".")) {
    const dotMatches = numberString.match(/\./g) || [];
    if (dotMatches.length > 1) {
      // Prüfe, ob der letzte Punkt an der 3. Stelle von rechts steht
      const lastDotIndex = numberString.lastIndexOf(".");
      if (numberString.length - lastDotIndex === 3) {
        // Entferne alle Punkte außer dem letzten
        numberString =
          numberString.substring(0, lastDotIndex).replace(/\./g, "") +
          numberString.substring(lastDotIndex);
      } else {
        numberString = numberString.replace(/\./g, ""); // Entferne alle Punkte
      }
    }
  } else if (numberString.includes(",")) {
    numberString = numberString.replace(",", ".");
  }

  numberString = numberString.replace("€", "");
  console.log(numberString);
  return parseFloat(numberString);
}
