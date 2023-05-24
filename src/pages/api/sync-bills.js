import { getBills } from "./Helpers/XeroHelper";
import { apisWithVaribales, api } from "./Helpers/MondayHelper";
import moment from "moment-timezone";
import { billBoardId, timezone, billGroupId } from "../../../config";

const Queue = require('bull');

const xeroQueue = new Queue('xeroQueue', 'redis://127.0.0.1:6379');

const syncBills = async (req, res) => {
    const date = moment().tz(timezone);
    let url = 'https://api.xero.com/api.xro/2.0/Invoices?';
    let type = 'ACCPAY';
    if (type){
        url += 'where=Type="ACCPAY"';
    }
    if (date){
        url += 'AND Date=DateTime('+date.format('YYYY')+', '+date.format('MM')+', '+date.format('DD')+')';
    }
    let invoices = await getBills(url);
    invoices.forEach(async(invoice) => {
        let columnsIdsQuery = `query {boards(ids: ${billBoardId}) {columns {id title}}}`;
        let columnsIds = await api(columnsIdsQuery);
     
        let amountId = columnsIds?.data?.boards?.length && columnsIds?.data?.boards[0]?.columns?.find(column => column.title == 'Amount')?.id;
        let statusId = columnsIds?.data?.boards?.length && columnsIds?.data?.boards[0]?.columns?.find(column => column.title == 'Status')?.id;
        let dueDateId = columnsIds?.data?.boards?.length && columnsIds?.data?.boards[0]?.columns?.find(column => column.title == 'Due Date')?.id;
        let xeroId = columnsIds?.data?.boards?.length && columnsIds?.data?.boards[0]?.columns?.find(column => column.title == 'Xero ID')?.id;
        let supplierId = columnsIds?.data?.boards?.length && columnsIds?.data?.boards[0]?.columns?.find(column => column.title == 'Supplier ID')?.id;
        let createQuery = `mutation { create_item (board_id: ${billBoardId}, group_id: ${billGroupId}, item_name: \"${invoice?.Contact?.Name}\") { id }}`;

        // check if invoice is already on monday
        const invoiceIdCheckQuery = `query {items_by_column_values (board_id: ${billBoardId}, column_id: \"${xeroId}\", column_value: \"${invoice.InvoiceID}\") {id name state column_values {id value title text} }}`;
        let savedInvoice = await api(invoiceIdCheckQuery);
        if (savedInvoice?.data?.items_by_column_values?.length == 0){
            const item = await api(createQuery);
            if (item?.data?.create_item?.id){
                const id = item?.data?.create_item?.id;
                let updateQuery = "mutation ($myBoardId:Int!, $myItemId:Int!, $myColumnValues:JSON!) { change_multiple_column_values(item_id:$myItemId, board_id:$myBoardId, column_values: $myColumnValues) { id }}";
                let variables = JSON.stringify({
                    myBoardId: parseInt(billBoardId),
                    myItemId: parseInt(id),
                    myColumnValues: `{\"${amountId}\" : \"${invoice.Total}\", \"${xeroId}\" : \"${invoice.InvoiceID}\", \"${statusId}\" : \"To Be Paid\", \"${dueDateId}\" : \"${moment(invoice.DueDateString).format('YYYY-MM-DD')}\", \"${statusId}\" : \"To Be Paid\", \"${supplierId}\" : \"${invoice.Contact.ContactID}\"}`
                });
                
                console.log(updateQuery)
                const column = await apisWithVaribales(updateQuery, variables);
            }
        }
        
    })
    // xeroHelper.createInvoice('test');

    // const limit = 1;
    // let skip = 0;
    // if (stringData.length == 0) {
    //   res.send("Done");
    // }
    // stringData.forEach(async (value) => {
    //   const job = await xeroQueue.add(
    //     {
    //       data: value,
    //     },
    //     { attempts: 3, delay: 6000 }
    //   );
    //   console.log(`Job #${job.id} is successfully added.`);
    //   skip += limit;
    //   if (skip === stringData.length) {
    //     console.log("Added all to the queue...");
    //   }
    // });
  
    res.send("Done");


//     xeroQueue.process(
//         async function (job) {
//             console.log(`Start Xero processing job #${job.id}`);
//             try {
//                 const googleSheetOutput = job.data.output;
//                 const googleSheetInput = job.data.input;
                
//                 await addRowToSheet({
//                     "output": googleSheetOutput,
//                     "input": googleSheetInput
//                 });
//             } catch (err) {
//                 console.error("Xero Error", err);
//                 throw err;
//             }
//         })
        
//         xeroQueue.on("completed", function (job) {
//             console.log(`Xero Completed #${job.id} Job`);
//         });
        
//         xeroQueue.on('failed', (job, err) => {
//             addErrorToSheet({
//                 "output": "Failed",
//                 "input": `Job #${job.id} failed :- ${job.data.googleSheetInput}`
//             });
//             console.log(`Xero Job ${job.id} failed ${JSON.stringify(err)}`)
//         })
};

export default syncBills;
