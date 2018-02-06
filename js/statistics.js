

$(document).ready(function(){

document.write("<br>OS</br>");

for (let i =0 ;i<3;i++)
{
  $.ajax({
    type : 'GET',
    url : "https://usernamescoredb.herokuapp.com/users/"+(i+1).toString(),
    data: {
      format: 'json'
    },
    headers : {
      'Access-Control-Allow-Origin' : '*'
    },
    success : function(data, textStatus) {
  /*    for (let i=0;i<data.length;i++)
      {
        console.log(data[i].name);
        console.log(data[i]);


      }*/

      console.log(data);

      document.write("<br>"+data.name+"<br>"+
      parseFloat(Math.round(data.scores[0] * 100) / 100).toFixed(2));
    },
    error : function(xhr, textStatus, errorThrown) {

    console.log('error');
    }
  });
}

});
