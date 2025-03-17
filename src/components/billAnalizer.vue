<script setup>
  import { ref } from 'vue';
  import Tesseract from 'tesseract.js';
  import * as pdfjsLib from 'pdfjs-dist';
  import nlp from 'compromise';
  
  pdfjsLib.GlobalWorkerOptions.workerSrc = './node_modules/pdfjs-dist/build/pdf.worker.min.mjs';

  // Reaktive Variablen
  const loading = ref(false);
  const jsonResult = ref(null);

  const foundData = ref({
    gesamtBetrag: 0,
    Austeller: "",
    Rechnungsnummer: 0,
    "UIS-Nummer": 0
  })

  


  // Funktion für den Dateiupload
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      extractTextFromImage(file);
    }
  };
  
  // Texterkennung aus Bilddatei mit Tesseract.js
  const extractTextFromImage = async (file) => {
    let extractableFile = file;




    if (file.type === "application/pdf"){
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1); // Extrahiere die erste Seite als Beispiel

      const scale = 2; // Höhere Auflösung für bessere OCR
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      await page.render({ canvasContext: context, viewport }).promise;
      extractableFile = canvas;
    }





    loading.value = true;
    jsonResult.value = null;
  




    Tesseract.recognize(
      extractableFile,
      'deu', // Sprache (kann auf 'deu' für Deutsch geändert werden)
      {
        //logger: (m) => console.log(m) // Optional: Logge den Fortschritt (optional)
      }
    )
      .then(({ data: { text } }) => {
        loading.value = false;
        // Nur den extrahierten Text verarbeiten
        //const structuredData = parseTextToJson(text);
        console.log(getGesamtBetrag(text))
        jsonResult.value = text;
      })
      .catch((error) => {
        //console.error("Fehler bei der Texterkennung:", error);
        loading.value = false;
      });
  };
  



// Funktionen um die verschiedenen Werte herauszufiltern.
  const getGesamtBetrag = (text)=>{
    const doc = nlp(text)
    const foundNumbers = [];


    const relevantWords = ['insgesamt', 'brutto', 'total', 'gesamtbetrag', "summe", 'rechnungsbetrag', 'netto']
    const amountRegex = /\b\d{1,3}(?:\.\d{3})*,\d{2}€?\b/;

    doc.document.forEach((lineArray, index) => {
      let containsRelevantWord = false;
      let foundAmount = 0;
      
      lineArray.forEach((element) => {
        if (element && typeof element.normal === 'string') {
          const text = element.text;

          // Prüfen, ob eines der relevanten Wörter enthalten ist
          const relevantWordFound = relevantWords.some(word => text.toLowerCase().includes(word));

          if (relevantWordFound) {
            containsRelevantWord = true; // Gefundene Nummer speichern
          }

          const amountMatch = text.match(amountRegex)
          if (amountMatch){
            foundAmount = amountMatch[0]
          }
        }
      })

      if(containsRelevantWord && foundAmount){
        console.log("This amount was found: ",parseFloat(foundAmount.replace(',', '.'))," in line ", index+1)
        foundNumbers.push(parseFloat(foundAmount.replace(',', '.')))
      }
    })

    return Math.max(...foundNumbers)
  }






  // Funktion zur Strukturierung des Textes als JSON
  const parseTextToJson = (text) => {
    // Entferne unnötige Leerzeilen und zerlege den Text in Zeilen
    const lines = text.split('\n').filter((line) => line.trim() !== '');
    const result = {};
  
    // Suche nach typischen Mustern in den Zeilen und extrahiere relevante Daten
    lines.forEach((line) => {
      // Beispiel: Suche nach Rechnungsnummer
      if (line.match(/Rechnungsnummer/i)) {
        result.invoiceNumber = line.split(':')[1]?.trim();
      }
      // Beispiel: Suche nach Betrag
      if (line.match(/Betrag/i) || line.match(/Total/i) || line.match(/Gesamt/i)) {
        result.totalAmount = line.split(':')[1]?.trim();
      }
      // Beispiel: Suche nach Kundenname
      if (line.match(/Kunde/i) || line.match(/Name/i)) {
        result.clientName = line.split(':')[1]?.trim();
      }
      // Weitere Felder hier hinzufügen, falls notwendig
    });
  
    // Falls keine der Felder gefunden wurde, gib eine Warnung aus
    if (!result.invoiceNumber || !result.totalAmount || !result.clientName) {
      console.warn("Nicht alle relevanten Daten wurden extrahiert.");
    }
    console.log(jsonResult)
    return result;
  };

  </script>

<template>
  <div class="min-h-full bg-gray-100 flex flex-col items-center justify-center p-6">
    <div class="bg-white shadow-lg rounded-lg p-6 w-full max-w-lg">
      <h1 class="text-2xl font-bold text-gray-800 mb-4">📄 Virus Daten</h1>

      <!-- File Input -->
      <label class="block">
        <span class="text-gray-700 font-medium">Datei hochladen:</span>
        <input 
          type="file" 
          @change="handleFileChange" 
          accept="image/*,.pdf"
          class="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm 
                 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer"
        />
      </label>

      <!-- Ladebalken -->
      <div v-if="loading" class="mt-4 text-blue-600 font-medium animate-pulse">
        🔄 Analyse läuft...
      </div>

      <!-- JSON Output -->
      <pre v-if="jsonResult" class="mt-4 p-3 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
        {{ jsonResult }}
      </pre>

      <!-- Gefundene Daten -->
      <div v-if="foundData.gesamtBetrag" class="mt-6 text-lg font-semibold text-green-700">
        💰 Gesamtbetrag: {{ foundData.gesamtBetrag }} €
      </div>
    </div>
  </div>
</template>

  
  
  <style scoped>
  /* Optional: Styling für deine App */
  </style>
  