import base64 from 'base-64';
import { supabase } from "../../../../supabase";
import { billBoardId, billGroupId, mondayApiKey, timezone } from "../../../../config";

const moment = require('moment-timezone'); //moment-timezone

export default class MondayHelper {
    constructor() {
      
    }
 
    async api(query) {
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

    async apisWithVaribales(query, variables) {
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
   
}