const express= require('express');
const  bodyparser=require('body-parser');
const pg=require('pg')
 const app =express();
  const PORT=3000;



  app.use(bodyparser.json());


   const pool= new pg.Pool({
     user:'postgres',
     host:'localhost',
     database:'my_pgdb',
     password:'123456',
     port:5241,
   });

// Book an appointmemt with a doctor

     app.post('/appointments',async(req,res)=>{
        try{
            const{doctorId,patientId,appointmentTime}=req.body;
            const client= await pool.connect();
            const existingAppointment = await client.query('SELECT * FROM appointments Where doctor_id=$1 And appointment_time=$2',[doctorId,patientId,appointmentTime]);
            if(existingAppointment.rows.length>0){
                return res.status(400).json({error:'Appointment slot already booked'});
            }
            //update appointment count for the doctor
             await client.query('UPDATE doctors SET appointment_count=appointment_count+1 WHERE id= $1',[doctorId]);

              // inert new appointment
               const result= await client.query(`INSERT INTO appointments(doctor_id,patient_id,appointment_time)VALUES($1,$2,$3)RETURNING *`,[doctorId,patientId,appointmentTime]);
               client.release();
               res.json(result.rows[0]);

        }catch(error){
            console.log("Error executing query",error);
            res.status(500).json({error:'An unexpected error occured'})
        }
    });

    //Retrieve availabe appointment solts for a specific doctor
     app.get('/doctor/doctorId/appointments',async(req,res)=>{
        try{
              const{doctorId}=req.params;
              const client=await pool.connect();
              const result=await client.query('SELECT * FROM appointmemts WHERE doctor_id=$1 AND status=$2',[doctorId,'scheduled']);
              client.release();
              res.json(result.rows);
        }catch(error){
            console.error('Error executing query', error);
            res.status(500).json({error:'an uexpected error occured'})
        }            
        
     });

     // get doctor sorted by ratings and count
      app.get('/doctors', async(req,res)=>{
        try{
            const client=await pool.connect();
            const result= await client.query(`SELECT * FROM doctors ORDERBY rating DESC,appointment_count ASC`);
            client.release();
            res.json(result.rows);


        } catch(error){
            console.error("error executing query",error);
            res.status(500).json({error:"An unexpected error occured"})
        }
      })


    
   app.listen(PORT,()=>{
    console.log(`server is sunning on  http://localhost: ${PORT}`);
   })
