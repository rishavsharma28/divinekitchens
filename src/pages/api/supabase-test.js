import { supabase } from "../../../supabase";

const syncBills = async (req, res) => {

    console.log('fetching supabase settings')

    const { data, error } = await supabase
    .from('settings')
    .select()
    .eq('id', 1);

    console.log('Supabase settings', data)

    res.send(data)
    
};

export default syncBills;
