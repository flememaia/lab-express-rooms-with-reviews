const router = require("express").Router();

const ReviewModel = require("../models/Review.model");

//Create new reviews for the rooms
router.post("/review", async (req, res, next) => {
    try {
 
      const addedReview = await ReviewModel.create({ comment: req.body, roomId: req.body.roomId._id});

        // const populateReview = await ReviewModel.findById(addedReview._id).populate('roomId');

      return res.status(200).json(addedReview);
    } catch (err) {
      next(err);
    }
  });

//Edit their own rooms
router.put("/review/:id", async (req, res, next) => {
    try {
      // Encontrar a Room com o id do parametro de rota
      const id = req.params.id;

      const foundReview = await ReviewModel.find();

      //check if the review exists
      if (!foundReview) {
        return res.status(404).json({ msg: "Review not found." });
      }
    //   ######ARRUMAR
    //   //check if it is the owner review who is trying to modify it
    //   if (!foundReview.user._id === xxxxx) {
    //     return res.status(404).json({ msg: "You are not allowed to modify other´s Review." });
    //   }
    //   ####ATUALIZAR DEPOIS QUE ACHOU
    //   return res.status(200).json(editReview);
    } catch (err) {
      console.log(err);
      next(err);
    }
  });

//Delete review => COMO CHECAR O USUÁRIO


//See the list of the rooms and all comments
router.get("/room", async (req, res, next) => {
    try {
 
      const allrooms = await RoomModel.find()

      return res.status(200).json(allrooms);
    } catch (err) {
      next(err);
    }
  });

  module.exports = router;