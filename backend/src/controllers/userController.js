exports.getUserProfile = async (req, res) => {
  try {
    const user = req.user; // from middleware
    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
