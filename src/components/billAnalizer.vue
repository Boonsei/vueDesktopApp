<script setup>
  import { ref } from 'vue';
  import Tesseract from 'tesseract.js';
  
  // Reaktive Variablen
  const loading = ref(false);
  const jsonResult = ref(null);
  
  // Funktion für den Dateiupload
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      extractTextFromImage(file);
    }
  };
  
  // Texterkennung aus Bilddatei mit Tesseract.js
  const extractTextFromImage = (file) => {
    loading.value = true;
    jsonResult.value = null;
  
    Tesseract.recognize(
      file,
      'deu', // Sprache (kann auf 'deu' für Deutsch geändert werden)
      {
        //logger: (m) => console.log(m) // Optional: Logge den Fortschritt (optional)
      }
    )
      .then(({ data: { text } }) => {
        loading.value = false;
        // Nur den extrahierten Text verarbeiten
        //const structuredData = parseTextToJson(text);
        jsonResult.value = text;
      })
      .catch((error) => {
        //console.error("Fehler bei der Texterkennung:", error);
        loading.value = false;
      });
  };
  
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
    <div>
      <h1>Rechnungstext Extraktion</h1>
      <input type="file" @change="handleFileChange" accept="image/*" />
      <div v-if="loading">Analyse läuft...</div>
      <pre v-if="jsonResult">{{ jsonResult }}</pre>
    </div>
  </template>
  
  
  <style scoped>
  /* Optional: Styling für deine App */
  </style>
  