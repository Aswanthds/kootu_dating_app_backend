const { admin, db } = require('../services/firebase');

/**
 * GET ALL QUESTIONS
 */
exports.getQuestions = async (req, res, next) => {
  try {
    const snap = await db.collection('profile_questions').orderBy('order', 'asc').get();
    const questions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(questions);
  } catch (error) {
    next(error);
  }
};

/**
 * GET MY ANSWERS
 */
exports.getMyAnswers = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const snap = await db.collection('user_answers').where('user_id', '==', userId).get();
    const answers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(answers);
  } catch (error) {
    next(error);
  }
};

/**
 * SAVE / UPDATE ANSWER
 * Uses the deterministic document ID (userId_questionId) as the upsert key.
 */
exports.saveAnswer = async (req, res, next) => {
  try {
    const { questionId, answerText } = req.body;
    const userId = req.user.id;

    // set() with { merge: true } = Firestore's equivalent of UPSERT
    await db.collection('user_answers').doc(`${userId}_${questionId}`).set({
      user_id: userId,
      question_id: questionId,
      answer_text: answerText,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    res.json({ success: true, message: 'Answer saved!' });
  } catch (error) {
    next(error);
  }
};
