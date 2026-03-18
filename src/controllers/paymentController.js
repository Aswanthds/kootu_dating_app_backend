const pool = require("../services/db");


exports.verifyPurchase = async (req, res, next) => {
    try {
        const { purchaseToken, productId } = req.body;
        const userId = req.user.id;
        const [result] = await pool.query(
            "INSERT INTO subscriptions (user_id, purchase_token,plan_id,expiry_date) VALUES (?,?,?,?)",
            [userId, purchaseToken, productId, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)]
        );

        await pool.query('UPDATE users SET is_premium = 1 WHERE id = ?', [userId])
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
}