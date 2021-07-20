const router = require("express").Router();

const RoomModel = require("../models/Room.model");

//Create new rooms
router.post("/room", async (req, res, next) => {
    try {
 
      const addedroom = await RoomModel.create(req.body);
  
      return res.status(200).json(addedroom);
    } catch (err) {
      next(err);
    }
  });

//Edit rooms
router.put("/rooms/:id", async (req, res, next) => {
    try {
      // Encontrar a Room com o id do parametro de rota
      const id = req.params.id;
  
      const editRoom = await RoomModel.findOneAndUpdate(
        { _id: id },
        { $set: { ...req.body } },
        { new: true} 
      );
  
      if (!editRoom) {
        return res.status(404).json({ msg: "Room not found." });
      }
  
      return res.status(200).json(editRoom);
    } catch (err) {
      console.log(err);
      next(err);
    }
  });

  //Delete rooms
  router.delete("/room/:id", async (req, res, next) => {
    try {
      const id = req.params.id;
  
      const deletionResult = await RoomModel.deleteOne({ _id: id });
  
      console.log(deletionResult);
  
      if (deletionResult.n === 0) {
        return res.status(404).json({ msg: "Room not found." });
      }
  
      return res.status(200).json({});
    } catch (err) {
      next(err);
    }
  });

//See the list of the rooms
router.get("/room", async (req, res, next) => {
    try {
 
      const allrooms = await RoomModel.find();
  
      return res.status(200).json(allrooms);
    } catch (err) {
      next(err);
    }
  });
  
  module.exports = router;