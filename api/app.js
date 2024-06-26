const fs = require('fs');
const path = require('path');
const express = require('express');
const http = require('http');
const cors = require('cors');
const conn = require('./connect/mariadb');
const app = express();

// 설정 파일의 경로
//const configPath = path.join(__dirname, '.', 'config.json');

// 설정 파일 읽기
//const configData = fs.readFileSync(configPath, 'utf8');
//const config = JSON.parse(configData);

// 서버 설정 가져오기
//const serverConfig = config.server;

// CORS 설정
//app.use(cors({ origin: serverConfig.host+':'+serverConfig.port }));
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const test = {
  "message": "test",
  "status": "successs"
};

app.get('/', (req, res) => {
  res.json(test); // JSON 객체를 응답으로 보냄
});

app.post('/login', (req, res) => {
  const { id, pw } = req.body;

  const query = 'select * from tb_user where user_id = ? and user_pw = ?';
  conn.query(query, [id, pw], (err, result) => {
    if (err) {
      console.error("Database select error:", err);
      res.status(500).send('Error select data into database');
    } else {
      if (result.length > 0) {
        res.status(200).json(result);
      } else {
        res.status(300).send('아이디 or 비밀번호가 없습니다.');
      }
    }
  });
});

app.post('/signup', (req, res) => {
  const { id, pw, name, birth } = req.body;
  const currentDate = new Date();
  const query1 = 'select * from tb_user where user_id = ?';
  conn.query(query1, [id], (err, result) => {
    if (err) {
      console.error("Database select error:", err);
      res.status(500).send('Error select data into database');
    } else {
      if (result.length > 0) {
        res.status(300).send('중복된 아이디 입니다.');
      } else {
        const query2 = 'INSERT INTO tb_user (user_id, user_pw, name, birth, img, insert_date) VALUES (?, ?, ?, ?, ?, ? )';
        conn.query(query2, [id, pw, name, birth, 'user.png', currentDate], (err, result) => {
          if (err) {
            console.error("Database insert error:", err);
            res.status(500).send('Error inserting data into database');
          } else {
            res.status(200).send('User data inserted successfully');
          }
        });
      }
    }
  });
});

app.post('/findIdPw', (req, res) => {
  const { name, birth } = req.body;
  const query = 'select * from tb_user where name = ? and birth = ?';
  conn.query(query, [name, birth], (err, result) => {
    if (err) {
      console.error("Database select error:", err);
      res.status(500).send('Error select data into database');
    } else {
      if (result.length > 0) {
        res.status(200).json(result);
      } else {
        res.status(300).send('가입된 아이디가 없습니다.');
      }
    }
  });
});

///////////////////////////////////////////////////////////////////////////////////////////////////

app.post('/load_post', (req, res) => {
  const { user_id } = req.body;
  const query = `   SELECT 
                    a.id AS post_id,
                    a.user_id AS post_user_id,
                    a.img AS post_img,
                    a.maintext AS post_maintext,
                    a.subtext AS post_subtext,
                    a.filter AS post_filter,
                    a.insertdate AS post_insertdate,
                    a.is_delete AS post_is_delete,
                    b.name AS user_name,
                    b.img AS user_img,
                    (SELECT COUNT(id) FROM tb_likes WHERE post_id=a.id AND is_set = "Y") AS likes,
                    (SELECT is_set FROM tb_likes WHERE post_id=a.id AND user_id = ?) AS is_set
                    FROM tb_post a 
                    LEFT JOIN tb_user b ON a.user_id=b.id 
                    ORDER BY a.id DESC
`;
  conn.query(query, [user_id],(err, result) => {
    if (err) {
      console.error("Database select error:", err);
      res.status(500).send('Error select data into database');
    } else {
      if (result.length > 0) {
        res.status(200).json(result);
      } else {
        res.status(300).send('올린 게시글이 없습니다');
      }
    }
  });
});

app.post('/load_profile', (req, res) => {
  const { id } = req.body;
  const query = `SELECT * FROM tb_user WHERE id=?`;
  conn.query(query, [id], (err, result) => {
    if (err) {
      console.error("Database select error:", err);
      res.status(500).send('Error select data into database');
    } else {
      if (result.length > 0) {
        res.status(200).json(result);
      } else {
        res.status(300).send('프로필 오류');
      }
    }
  });
});

app.post('/updateProfile', (req, res) => {
  const { user_pw,name,birth,user_id} = req.body;
  const currentDate = new Date();
  const query2 = `UPDATE tb_user SET  
                  user_pw = ?
                  ,name = ?
                  ,birth = ?
                  ,update_date = ?
                  WHERE user_id = ?`;
      conn.query(query2, [user_pw, name,birth,currentDate,user_id], (err, result) => {
      if (err) {
      console.error("Database insert error:", err);
      res.status(500).send('Error UPDATE data into database');
      } else {
        res.status(200).send('User updated successfully');
      }
  });
});


app.post('/create_post', (req, res) => {
  const { user_id, updateImg, maintext, subtext, filter } = req.body;
  const currentDate = new Date();
  const query2 = 'INSERT INTO tb_post (user_id, img, maintext, subtext, filter, insertdate) VALUES (?, ?, ?, ?, ?, ? )';
  conn.query(query2, [user_id, updateImg, maintext, subtext, filter, currentDate], (err, result) => {
    if (err) {
      console.error("Database insert error:", err);
      res.status(500).send('Error inserting data into database');
    } else {

      res.status(200).send('Post created successfully');
    }
  });
});

app.post('/delete_post', (req, res) => {
  const { id } = req.body;
  const query2 = 'UPDATE tb_post SET is_delete = "Y" WHERE id = ?';
      conn.query(query2, [id], (err, result) => {
      if (err) {
      console.error("Database insert error:", err);
      res.status(500).send('Error UPDATE data into database');
      } else {
        res.status(200).send('Post deleted successfully');
      }
  });
});

app.post('/modify_post', (req, res) => {
  const { id,maintext,subtext } = req.body;
  const query2 = 'UPDATE tb_post SET maintext = ?, subtext = ? WHERE id = ?';
      conn.query(query2, [maintext, subtext,id], (err, result) => {
      if (err) {
      console.error("Database insert error:", err);
      res.status(500).send('Error UPDATE data into database');
      } else {
        res.status(200).send('Post deleted successfully');
      }
  });
});

app.post('/like_on_off', (req, res) => {
  const { user_id,post_id } = req.body;
  const query = 'select * from tb_likes where user_id = ? and post_id = ?';
  conn.query(query, [user_id,post_id], (err, result) => {
    if (err) {
      console.error("Database select error:", err);
      res.status(500).send('Error select data into database');
    } else {
      if (result.length > 0) {
        console.log('like update');
        if (result[0].is_set=='N'){
          likes_ck = 'Y';
        }else{
          likes_ck = 'N';
        }
        const query2 = 'UPDATE tb_likes SET is_set = ? where user_id = ? and post_id = ?';
        conn.query(query2, [likes_ck, user_id, post_id], (err, result) => {
          if (err) {
          console.error("Database insert error:", err);
          res.status(500).send('Error updated data into database');
          } else {
            res.status(200).send('Like offed successfully');
          }
        });
      } else {
        console.log('like insert');
        const query2 = 'INSERT INTO tb_likes (user_id, post_id,is_set) VALUES (?, ? , "Y")';
        conn.query(query2, [user_id, post_id], (err, result) => {
          if (err) {
            console.error("Database insert error:", err);
            res.status(500).send('Error INSERT data into database');
          } else {
            res.status(200).send('Like inserted successfully');
          }
        });
      }
    }
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////
// 이미지 로컬에  다운로드 
const multer  = require('multer');
// 이미지 경로
const uploadDir = path.join(__dirname, '../src/assets/img');
// multer 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    // 파일 확장자를 소문자로 변환하여 확장자를 jpg로 수정
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.jpg') {
        cb(null, Date.now() + '.jpg');
    } else {
        cb(null, Date.now() + ext);
    }
  }
})


const upload = multer({ storage: storage });
app.post('/postImgDown', upload.single('image'), (req, res) => {
  // 이미지 파일의 정보 req.file 저장
  const imagePath = req.file.path;
  console.log('Image Path:', imagePath);
  res.send(imagePath);
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////

server.listen(3000, () => {
  console.log(`Server running`);
});




