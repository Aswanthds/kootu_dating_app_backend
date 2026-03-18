const pool = require('../services/db');

/**
 * GET ALL QUESTIONS
 * Goal: Return the list of predefined questions from the DB.
 */
exports.getQuestions = async (req, res, next) => {
  try {
    // ??? WHAT IS THE SQL TO GET ALL QUESTIONS ???
    const [questions] = await pool.query('SELECT * FROM profile_questions'); 
    res.json(questions);
  } catch (error) {
    next(error);
  }
};

/**
 * GET MY ANSWERS
 * Goal: Return the answers the LOGGED-IN user has already saved.
 */
exports.getMyAnswers = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // ??? WHAT IS THE SQL TO GET ANSWERS + QUESTION TEXT ???
    // Hint: You need to JOIN 'user_answers' with 'profile_questions'
    const sql = `
        SELECT ua.answer_text, pq.question_text 
        FROM user_answers ua
        JOIN profile_questions pq ON ua.question_id = pq.id
        WHERE ua.user_id = ?
    `;

    const [answers] = await pool.query(sql, [userId]);
    res.json(answers);
  } catch (error) {
    next(error);
  }
};

/**
 * SAVE / UPDATE ANSWER
 * Goal: Insert a new answer or update an old one using ON DUPLICATE KEY UPDATE.
 */
exports.saveAnswer = async (req, res, next) => {
  try {
    const { questionId, answerText } = req.body;
    const userId = req.user.id; // Security: Always take ID from the Token!

    const sql = `
      INSERT INTO user_answers (user_id, question_id, answer_text)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE answer_text = ?
    `;

    // We pass answer_text twice: once for the potential INSERT, once for the UPDATE.
    await pool.query(sql, [userId, questionId, answerText, answerText]);

    res.json({ success: true, message: "Answer saved!" });
  } catch (error) {
    next(error);
  }
};

