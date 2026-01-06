import * as admin from "firebase-admin";
import * as dotenv from "dotenv";

dotenv.config();

// Initialize with production credentials to READ from prod
admin.initializeApp({
  projectId: process.env.PROD_PROJECT_ID,
  credential: admin.credential.applicationDefault(),
});

// Get production database
const prodDb = admin.firestore();

async function exportData() {
  try {
    // Export stories from PRODUCTION
    console.log("Exporting stories from production...");
    const storiesSnapshot = await prodDb.collection("stories").get();

    const exportData: any = {};
    exportData.stories = {};

    for (const doc of storiesSnapshot.docs) {
      const storyId = doc.id;
      const storyData = doc.data();

      exportData.stories[storyId] = storyData;

      // Export chapters subcollection
      const chaptersSnapshot = await doc.ref.collection("chapters").get();
      exportData.stories[storyId].__chapters = {};
      chaptersSnapshot.forEach((chapterDoc) => {
        exportData.stories[storyId].__chapters[chapterDoc.id] =
          chapterDoc.data();
      });

      // Export characters subcollection
      const charactersSnapshot = await doc.ref.collection("characters").get();
      exportData.stories[storyId].__characters = {};
      charactersSnapshot.forEach((characterDoc) => {
        exportData.stories[storyId].__characters[characterDoc.id] =
          characterDoc.data();
      });

      // Export plot subcollection
      const plotSnapshot = await doc.ref.collection("plots").get();
      exportData.stories[storyId].__plots = {};
      plotSnapshot.forEach((plotDoc) => {
        exportData.stories[storyId].__plots[plotDoc.id] = plotDoc.data();
      });

      // Export places subcollection
      const placesSnapshot = await doc.ref.collection("places").get();
      exportData.stories[storyId].__places = {};
      placesSnapshot.forEach((placeDoc) => {
        exportData.stories[storyId].__places[placeDoc.id] = placeDoc.data();
      });

      console.log(`Exported story: ${storyId}`);
    }

    console.log("\n✅ Data exported from production");
    console.log(`Total stories exported: ${storiesSnapshot.size}`);

    // Now import to EMULATOR
    console.log("\n📥 Importing to emulator...");

    // Create a second app instance for the emulator
    const emulatorApp = admin.initializeApp(
      {
        projectId: process.env.PROD_PROJECT_ID,
      },
      "emulator"
    );

    const emulatorDb = emulatorApp.firestore();

    // Point to emulator
    emulatorDb.settings({
      host: "localhost:8080",
      ssl: false,
    });

    // Import stories to emulator
    for (const [storyId, storyData] of Object.entries(
      exportData.stories
    ) as any[]) {
      const { __chapters, __characters, __plots, __places, ...mainStoryData } =
        storyData;

      // Create story document
      await emulatorDb.collection("stories").doc(storyId).set(mainStoryData);

      // Import chapters
      if (__chapters) {
        for (const [chapterId, chapterData] of Object.entries(__chapters)) {
          await emulatorDb
            .collection("stories")
            .doc(storyId)
            .collection("chapters")
            .doc(chapterId)
            .set(chapterData as any);
        }
      }

      // Import characters
      if (__characters) {
        for (const [characterId, characterData] of Object.entries(
          __characters
        )) {
          await emulatorDb
            .collection("stories")
            .doc(storyId)
            .collection("characters")
            .doc(characterId)
            .set(characterData as any);
        }
      }

      // Import plots
      if (__plots) {
        for (const [plotId, plotData] of Object.entries(__plots)) {
          await emulatorDb
            .collection("stories")
            .doc(storyId)
            .collection("plots")
            .doc(plotId)
            .set(plotData as any);
        }
      }

      // Import places
      if (__places) {
        for (const [placeId, placeData] of Object.entries(__places)) {
          await emulatorDb
            .collection("stories")
            .doc(storyId)
            .collection("places")
            .doc(placeId)
            .set(placeData as any);
        }
      }

      console.log(`Imported story to emulator: ${storyId}`);
    }

    console.log("\n✅ Import to emulator completed!");
  } catch (error) {
    console.error("Error:", error);
  }

  process.exit(0);
}

exportData();
