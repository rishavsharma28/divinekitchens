import { mondayApiKey } from "../../../../config";

export const api = async(query) => {
    try {
        const response = await fetch("https://api.monday.com/v2", {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': mondayApiKey
        },
        body: JSON.stringify({
            'query': query
        })
    }).then(res => res.json()).catch(error => console.log('Monday error', error));
    return response 
} catch (error){
    return null;
}
}

export const apisWithVaribales = async(query, variables) => {
    try {
        const res = await fetch ("https://api.monday.com/v2", {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            'Authorization' : mondayApiKey
        },
        body: JSON.stringify({
            query,
            variables
        })
    }).then(res => res.json()).catch(error => console.log('Monday error', error));
    return res;
} catch (error){
    return null;
}
}
