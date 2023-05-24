import { supabase } from "../../../../../supabase";

export default async function handler(req: any, res: any) {
    const reqData = req.body;
    console.log(reqData);

    const { data, error } = await supabase
    .from('settings')
    .select()
    .eq('id', 1)
  
    return res.status(200).json({ data : data && data.length && data.length > 0 ? data[0] : null, error });
}