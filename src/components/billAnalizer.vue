<script setup>
import { ref } from "vue";
import Tesseract from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist";
import nlp from "compromise/three";
import { parseNumber } from "@/helperFunctions/functions.js";

pdfjsLib.GlobalWorkerOptions.workerSrc =
    "./node_modules/pdfjs-dist/build/pdf.worker.min.mjs";

// Reaktive Variablen
const loading = ref(false);
const foundData = ref({
    gesamtBetrag: 0,
    Austeller: "Ich",
    Rechnungsnummer: 0,
    "UIS-Nummer": 0,
});

// Funktion für den Dateiupload
const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
        const nlpDoc = await extractTextFromImage(file);
        console.log("HandleFileChange: ",nlpDoc)
        const gesamtBetrag = getGesamtBetrag(nlpDoc);
        foundData.value.gesamtBetrag = gesamtBetrag.maxNumb;
        //console.log("maxNumb: ", gesamtBetrag.maxNumb);
        //console.log("Options: ", gesamtBetrag.options);
        getRechnungsAusteller(nlpDoc)
    }
};

// Texterkennung aus Bilddatei mit Tesseract.js und pdfjslib.
const extractTextFromImage = async (file) => {

    if (file.type === "application/pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let formattedText = ""

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const text = await page.getTextContent();

            let lineMap = new Map();

            text.items.forEach((item) => {
                const y = Math.round(item.transform[5]); //holt die y koordinate
                if (!lineMap.has(y)) lineMap.set(y, []);
                lineMap.get(y).push(item.str);
            });

            const sortedMap = Array.from(lineMap.entries()).sort(
                (a, b) => b[0] - a[0],
            );

            const finalArr = sortedMap.map((entry) => entry[1]); //index 1 cause 0 is key of Map

            formattedText += finalArr
                .map((line) => line.join(" "))
                .join("\n")
                .replace(/(\. )/g, "### ");

        }

        return nlp(formattedText);
    }



    try {
        // Warten auf das OCR-Ergebnis mit `await`, damit das Ergebnis zurückgegeben wird
        const { data: { text } } = await Tesseract.recognize(file, "deu");

        loading.value = false;

        const modifiedText = text.replace(/(\. )/g, "### "); // Punkte ersetzen
        const doc = nlp(modifiedText);

        console.log("✅ NLP-Dokument:", doc); // Wird korrekt angezeigt

        return doc; // Wird jetzt richtig zurückgegeben!
    } catch (error) {
        console.error("Fehler bei der Texterkennung:", error);
        loading.value = false;
        return null;
    }
};

// Funktion um gesamtbetrag zu filtern
const getGesamtBetrag = (nlpDoc) => {
    const textArray = nlpDoc.document;
    const foundNumbers = [];

    const relevantWords = [
        "gesamt",
        "insgesamt",
        "brutto",
        "total",
        "gesamtbetrag",
        "summe",
        "rechnungsbetrag",
        "netto",
        "betrag",
        "gesamtsumme",
        "rechnungssumme",
        "zahlbetrag",
        "zu zahlen",
        "zahlbar",
        "zahlung",
        "offener betrag",
        "endbetrag",
        "fällig",
        "rechnungsendbetrag",
        "gesamtpreis",
        "zahlungsbetrag",
        "schlusssumme",
        "verrechnungsbetrag",
        "differenzbetrag",
        "inkl. mwst",
        "inklusive steuer",
        "mit steuer",
    ];

    const amountRegex = /^(€|EUR)?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(€|EUR)?$/;

    textArray.forEach((lineArray, index) => {
        let containsRelevantWord = false;
        let foundAmount = 0;

        //geht durch jede line des Documents
        lineArray.forEach((element) => {
            if (element && typeof element.normal === "string") {
                const text = element.text;

                // Prüfen, ob eines der relevanten Wörter enthalten ist
                const relevantWordFound = relevantWords.some((word) => {
                    return text.toLowerCase().includes(word);
                });

                if (relevantWordFound) {
                    /*console.log(
                        "Relevant word found in line with index: ",
                        index,
                        text,
                    );*/
                    containsRelevantWord = true; // Diese Line enthält eines von unseren KeyWords
                }

                const amountMatch = text.match(amountRegex);
                if (amountMatch) {
                    console.log(amountMatch," found in line: ", index);
                    foundAmount = amountMatch[0];
                    //console.log("Someamount matches", amountMatch);
                }
            }
        });

        if (containsRelevantWord && foundAmount) {
            foundNumbers.push(parseNumber(foundAmount));
        }
    });

    return {
        maxNumb: Math.max(...foundNumbers),
        options: foundNumbers,
    };
};

const getRechnungsAusteller = (textArray) => {
  console.log(textArray.constructor.name)
}
</script>

<template>
    <div
        class="min-h-full bg-gray-100 flex flex-col items-center justify-center p-6"
    >
        <div class="bg-white shadow-lg rounded-lg p-6 w-full max-w-lg">
            <h1 class="text-2xl font-bold text-gray-800 mb-4">
                📄 Virus Daten
            </h1>

            <!-- File Input -->
            <label class="block">
                <span class="text-gray-700 font-medium">Datei hochladen:</span>
                <input
                    type="file"
                    @change="handleFileChange"
                    accept="image/*,.pdf"
                    class="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer"
                />
            </label>

            <!-- Ladebalken -->
            <div
                v-if="loading"
                class="mt-4 text-blue-600 font-medium animate-pulse"
            >
                🔄 Analyse läuft...
            </div>

            <!-- Gefundene Daten -->
            <div
                v-if="foundData.gesamtBetrag"
                class="mt-6 text-lg font-semibold text-green-700"
            >
                💰 Gesamtbetrag: {{ foundData.gesamtBetrag }} €
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Optional: Styling für deine App */
</style>
