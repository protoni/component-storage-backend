let mongoose = require("mongoose");
let BlogPost = require("./models/BlogPost");


module.exports = {

    save: function (obj) {
        
        /*
      let blog = new BlogPost({
        title: obj.filename,
        content: obj.data
      })*/
      if(!obj.autosave) {
        console.log("Saved!")
      }
      

      let data = {
        title: obj.filename,
        content: obj.data
      }

    
      BlogPost.findOneAndUpdate({title:obj.filename}, data, {upsert:true, useFindAndModify:false}, function(err, item) {
          if(err) {
              return false;
          } else {
            return true;
          }
      })
    },

    load: function (title) {
        let query = {title:title};

        return new Promise((resolve, reject) => {
          
              
            BlogPost.findOne(query, function(err, item) {
              if(err) {
                return reject(err);
              }
              if(!item) {
                resolve(false);
              }
              console.log("item: " + item);
              resolve(item);
              //return item;
              
            })

          
      }).catch(error => {
          console.log("mongodb error: " + error.message);
          return 0;
      })

        
    }
  };