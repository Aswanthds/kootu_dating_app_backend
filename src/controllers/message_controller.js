const pool = require('../services/db');


exports.getMessages = async (req, res, next) => {
    try {
        const roomId = req.body.roomId;

        const [messages] = await pool.query(
            "SELECT * FROM messages WHERE chat_room_id = ? ORDER BY sent_time ASC", [roomId]);

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
        const [result] = await pool.query(
            "INSERT INTO messages (chat_room_id,sender_id,content) VALUES (?,?,?)",
            [roomId, userId, message]
        );

        await pool.query("UPDATE chat_rooms SET last_message = ?, last_message_time = CURRENT_TIMESTAMP WHERE id = ?", [message, roomId]);

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