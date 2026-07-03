import { Review } from "../models/Review.js";
import { Tailor } from "../models/Tailor.js";

export async function createReview(req, res, next) {
  try {
    const review = await Review.create({ ...req.body, customerId: req.user._id });
    const stats = await Review.aggregate([
      { $match: { tailorId: review.tailorId } },
      { $group: { _id: "$tailorId", ratingAvg: { $avg: "$rating" }, totalReviews: { $sum: 1 } } }
    ]);

    if (stats[0]) {
      await Tailor.findByIdAndUpdate(review.tailorId, {
        ratingAvg: Number(stats[0].ratingAvg.toFixed(2)),
        totalReviews: stats[0].totalReviews
      });
    }

    res.status(201).json({ review });
  } catch (error) {
    next(error);
  }
}
