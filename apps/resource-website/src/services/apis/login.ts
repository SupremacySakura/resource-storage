export const postLogin = async (username: string, password: string) => {
   const response = await fetch('http://localhost:3001/api/auth/login',{
        method:'post',
        body:JSON.stringify({
            username,
            password,
        }),
        headers:{
            'Content-Type':'application/json'
        }
    })
    const data = await response.json()
    return data
}