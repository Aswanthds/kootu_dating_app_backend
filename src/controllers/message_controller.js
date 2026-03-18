const pool = require('../services/pg_db');


exports.getMessages = async (req, res, next) => {
    try {
        const roomId = req.body.roomId;

        const { rows: messages } = await pool.query(
            "SELECT * FROM messages WHERE chat_room_id = $1 ORDER BY sent_time ASC", [roomId]);

        res.json({
            success: true,
            data: messages,
        });

    } catch (err) {
        res.json({
            success: false,
            data: null,
        });
        next(err);
    }
};




exports.sendMessage = async (req, res, next) => {
    try {
        const { roomId, message } = req.body;
        const userId = req.user.id;
        const { rows: result } = await pool.query(
            "INSERT INTO messages (chat_room_id,sender_id,content) VALUES ($1,$2,$3)",
            [roomId, userId, message]
        );

        await pool.query("UPDATE chat_rooms SET last_message = $1, last_message_time = CURRENT_TIMESTAMP WHERE id = $2", [message, roomId]);

        res.json({
            success: true,
            data: result,
        });
    } catch (err) {
        res.json({
            success: false,
            data: null,
        });
        next(err);
    }
};