import { useState } from "react";

function AdminCaseStudies() {

  const [form,setForm] = useState({
      title:"",
      client:"",
      summary:"",
      outcome:"",
      badge:"badge-blue"
  });

  const saveCaseStudy = async () => {

      await fetch('/api/admin/case-studies',{
          method:'POST',
          headers:{
              'Content-Type':'application/json'
          },
          body:JSON.stringify(form)
      });

      alert("Saved");
  };

  return (
    <div>

      <h1>Create Case Study</h1>

      <input
        placeholder="Title"
        onChange={(e)=>setForm({...form,title:e.target.value})}
      />

      <input
        placeholder="Client"
        onChange={(e)=>setForm({...form,client:e.target.value})}
      />

      <textarea
        placeholder="Summary"
        onChange={(e)=>setForm({...form,summary:e.target.value})}
      />

      <textarea
        placeholder="Outcome"
        onChange={(e)=>setForm({...form,outcome:e.target.value})}
      />

      <button onClick={saveCaseStudy}>
        Save
      </button>

      <button onClick={() => editCaseStudy(id)}>
        Edit
      </button>

      <button onClick={() => deleteCaseStudy(id)}>
        Delete
      </button>

    </div>
  );
}

export default AdminCaseStudies;