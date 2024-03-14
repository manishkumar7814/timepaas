const express = require('express');
const router = express.Router();
const mongoose = require("mongoose");
const requireLogin = require('../middleware/requireLogin');
const POST = mongoose.model("POST")
const { route } = require("./auth");

router.get("/allposts", requireLogin, (req, res) => {
    let limits = req.query.limits
    POST.find().populate("postedBy", "_id name Photo")
    .populate("comments.postedBy", "_id name")
    .limit(parseInt(limits))
    .sort("-createdAt")
    .then(posts=>res.json(posts)).catch(err => console.log(err))
})

router.post("/createPost", requireLogin,(req, res)=>{
    const {body, pic} = req.body;
    console.log(pic)
    if(!body || !pic){
        return res.status(422).json("Please add all the fields")
    }
    console.log(req.user)
    const post = new POST({
        body,
        photo : pic,
        postedBy: req.user
    })
    post.save().then((result)=>{
        return res.json({post:result})
    }).catch(err=>console.log(err))
})

router.get("/myposts", requireLogin, (req, res) => {
    POST.find({ postedBy: req.user._id })
        .populate("postedBy", "_id name")
        .populate("comments.postedBy", "_id name")
        .sort("-createdAt")
        .then(myposts => {
            res.json(myposts)
        })
})

router.put("/like", requireLogin, (req, res) => {
    POST.findByIdAndUpdate(req.body.postId, {
        $push: { likes: req.user._id }
    }, {
        new: true
    })
    .populate("postedBy", "_id name Photo")
    .then((result) => {
        res.json(result)
    })
    .catch((err) => {
        return res.status(422).json({ error: err })
    })
})

router.put("/unlike", requireLogin, (req, res) => {
    POST.findByIdAndUpdate(req.body.postId, {
        $pull: { likes: req.user._id }
    }, {
        new: true
    }).populate("postedBy", "_id name Photo")
    .then((result) => {
        res.json(result)
    })
    .catch((err) => {
        return res.status(422).json({ error: err })
    })
})

router.put("/comment", requireLogin, (req, res) => {
    const comment = {
        comment: req.body.text,
        postedBy: req.user._id
    }
    POST.findByIdAndUpdate(req.body.postId, {
        $push: { comments: comment }
    }, {
        new: true
    })
        .populate("comments.postedBy", "_id name")
        .populate("postedBy", "_id name Photo")
        .then((result) =>{
            res.json(result)
        })
        .catch((err) => {
            return res.status(422).json({ error: err })
        })
})

// Api to delete post
// router.delete("/deletePost/:postId", requireLogin, (req, res) => {
//     POST.findOne({ _id: req.params.postId })
//         .populate("postedBy", "_id")
//         .exec((err, post) => {
//             if (err || !post) {
//                 return res.status(422).json({ error: err })
//             }

//             if (post.postedBy._id.toString() == req.user._id.toString()) {

//                 post.remove()
//                     .then(result => {
//                         return res.json({ message: "Successfully deleted" })
//                     }).catch((err) => {
//                         console.log(err)
//                     })
//             }
//         })
// })
router.delete("/deletePost/:postId", requireLogin, (req, res) => {
    POST.findOne({ _id: req.params.postId })
        .populate("postedBy", "_id")
        .then(post => {
            console.log("Post found:", post);
            if (!post) {
                return res.status(422).json({ error: "Post not found" });
            }

            if (post.postedBy._id.toString() !== req.user._id.toString()) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            return post.deleteOne();
        })
        .then(result => {
            console.log("Deletion result:", result);
            return res.json({ message: "Successfully deleted" });
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: "Internal Server Error" });
        });
});

    

// to show following post
router.get("/myfollwingpost", requireLogin, (req, res) => {
    POST.find({ postedBy: { $in: req.user.following } })
        .populate("postedBy", "_id name")
        .populate("comments.postedBy", "_id name")
        .then(posts => {
            res.json(posts)
        })
        .catch(err => { console.log(err) })
})

module.exports = router;