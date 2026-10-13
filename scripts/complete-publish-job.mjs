const {STUDIO_URL,PUBLISH_JOB,PUBLISH_JOB_TOKEN,RESULT,PUBLISHED_COMMIT}=process.env
if(!/^https:\/\//.test(STUDIO_URL||'')||!PUBLISH_JOB_TOKEN)throw Error('Publishing callback is not configured')
const response=await fetch(STUDIO_URL.replace(/\/$/,'')+'/api/publish-job/'+PUBLISH_JOB+'/complete',{method:'POST',headers:{Authorization:'Bearer '+PUBLISH_JOB_TOKEN,'Content-Type':'application/json'},body:JSON.stringify({conclusion:RESULT==='success'?'success':RESULT==='cancelled'?'cancelled':'failure',commit:PUBLISHED_COMMIT||null})})
if(!response.ok)throw Error('Could not report publishing result')
