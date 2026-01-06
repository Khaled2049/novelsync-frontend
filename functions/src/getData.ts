import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const getData = onRequest(async (request, response) => {
  try {
    const storiesRef = db.collection("stories");
    const snapshot = await storiesRef.get();

    if (snapshot.empty) {
      logger.info('No matching documents found in the "stories" collection.');
      response.status(404).send("No stories found");
      return;
    }

    const storiesData: any[] = [];

    // Use Promise.all to fetch all stories and their subcollections in parallel
    await Promise.all(
      snapshot.docs.map(async (doc) => {
        const storyData = {
          id: doc.id,
          ...doc.data(),
          chapters: [] as any[],
          characters: [] as any[],
          plots: [] as any[],
          places: [] as any[],
        };

        // Fetch all subcollections in parallel
        const [
          chaptersSnapshot,
          charactersSnapshot,
          plotsSnapshot,
          placesSnapshot,
        ] = await Promise.all([
          doc.ref.collection("chapters").get(),
          doc.ref.collection("characters").get(),
          doc.ref.collection("plots").get(),
          doc.ref.collection("places").get(),
        ]);

        // Add chapters data
        chaptersSnapshot.forEach((chapterDoc) => {
          storyData.chapters.push({
            id: chapterDoc.id,
            ...chapterDoc.data(),
          });
        });

        // Add characters data
        charactersSnapshot.forEach((characterDoc) => {
          storyData.characters.push({
            id: characterDoc.id,
            ...characterDoc.data(),
          });
        });

        // Add plots data
        plotsSnapshot.forEach((plotDoc) => {
          storyData.plots.push({
            id: plotDoc.id,
            ...plotDoc.data(),
          });
        });

        // Add places data
        placesSnapshot.forEach((placeDoc) => {
          storyData.places.push({
            id: placeDoc.id,
            ...placeDoc.data(),
          });
        });

        storiesData.push(storyData);
      })
    );

    logger.info("Fetched all stories data with subcollections or have I?", {
      storiesCount: storiesData.length,
    });

    response.status(200).json(storiesData);
  } catch (error) {
    logger.error("Error fetching stories data:", error);
    response.status(500).send("Internal Server Error");
  }
});
