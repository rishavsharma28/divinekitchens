import axios from 'axios';
import moment from 'moment';
import XeroHelper from "./Helpers/XeroHelper";
import MondayHelper from "./Helpers/MondayHelper";
import { invoiceBoardId, mondayApiKey, redisUrl } from "../../../config";

const createInvoice = async (req, res) => {
    try {
        let todayDate = moment().format("YYYY-MM-DD")
        let query = `query {items_by_column_values (board_id: ${invoiceBoardId}, column_id: \"invoice_sent\", column_value: \"${todayDate}\") {id name group { title } state column_values {id value title text} }}`
        let data = await fetch("https://api.monday.com/v2", {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': mondayApiKey
            },
            body: JSON.stringify({
                'query': query
            })
        }).then(data => data.json())
        let boardsData = data.data.items_by_column_values.filter(el => el.group.title == 'Final Deposit' || el.group.title == 'Drawings Deposit' || el.group.title == 'Production Deposit' || el.group.title == 'Delivery Deposit' || el.group.title == 'Stone Measure Deposit');
        boardsData.forEach(async (element) => {
            let mondayHelper = new MondayHelper();
            const searchedValue = element.column_values.find(el => el.title == 'Invoice ID' && el.text == '')
            const paymentValue = element.column_values.find(el => el.title == 'Payment' && el.text != 'CA')

            if (searchedValue && paymentValue) {
                const dueDate = element.column_values.find(el => el.title == 'Due Date')
                const amount = element.column_values.find(el => el.title == 'Amount')
                const invoiceId = element.column_values.find(el => el.title == 'Invoice ID')
                const statusId = element.column_values.find(el => el.title == 'Status')
                const stageId = element.column_values.find(el => el.title == 'Stage')
                const emailId = element.column_values.find(el => el.title == 'Email')
                const customerId = element.column_values.find(el => el.title == 'Customer ID')

                const xeroHelper = new XeroHelper();
                const xeroResponse = await xeroHelper.createInvoice({
                    element: element,
                    dueDate: dueDate.text ? dueDate.text : todayDate,
                    date: todayDate,
                    stage: stageId.text,
                    amount: amount.text ? Number(amount.text) : 0,
                    email: emailId.text ? emailId.text : '',
                });
                console.log({xeroResponse})
                console.log(xeroResponse.Invoices[0])
                let updateQuery = "mutation ($myBoardId:Int!, $myItemId:Int!, $myColumnValues:JSON!) { change_multiple_column_values(item_id:$myItemId, board_id:$myBoardId, column_values: $myColumnValues) { id }}";
                let variables = JSON.stringify({
                    myBoardId: parseInt(invoiceBoardId),
                    myItemId: parseInt(element.id),
                    myColumnValues: `{\"${invoiceId.id}\" : \"${xeroResponse.Invoices[0].InvoiceID}\", \"${customerId.id}\" : \"${xeroResponse.Invoices[0].Contact.ContactID}\", \"${statusId.id}\" : \"Invoice Sent\", \"${dueDate.id}\" : \"${moment(xeroResponse.Invoices.DueDateString).format('YYYY-MM-DD')}\"}`
                });
                const column = await mondayHelper.apisWithVaribales(updateQuery, variables);
                console.log(column, "Items updated on monday", element?.name)
            } else {
                console.log( element?.name, ":- Alrrady Invoice ID or Payment is CA")
            }
        });
        res.send("Done")
    } catch (err) {
        console.log({ err })
        return res.status(403).json({ output: "Something went wrong" });
    }
};

export default createInvoice;
