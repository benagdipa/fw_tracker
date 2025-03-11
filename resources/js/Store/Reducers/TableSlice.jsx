import { createSlice } from "@reduxjs/toolkit"

export const TableSlice = createSlice({
    name: 'Table',
    initialState: {
        changedData:[],
        addNewRowData:{},
        addNewRow:false,
        changedDataFW:[],
        addNewRowDataFW:{},
        addNewRowFW:false,
        databaseChanged:{},
    },
    reducers: {
        setChangedData: (state, action) => {
            if (action.payload && Object.keys(action.payload).length > 0) {
                state.changedData = action.payload;
            }
        },
        setAddNewRowData: (state, action) => {
            state.addNewRowData = action.payload
        },
        setAddNewRow: (state, action) => {
            state.addNewRow = action.payload
        },
        setChangedDataFW: (state, action) => {
            if (action.payload && Object.keys(action.payload).length > 0) {
                state.changedDataFW = action.payload;
            }
        },
        setAddNewRowDataFW: (state, action) => {
            state.addNewRowDataFW = action.payload
        },
        setAddNewRowFW: (state, action) => {
            state.addNewRowFW = action.payload
        },
        setDataBaseChange:(state,action)=>{
            state.databaseChanged=action.payload
        }
  
  
    }
})

export const {setChangedData ,setAddNewRowData,setAddNewRow,setChangedDataFW,setAddNewRowDataFW,setAddNewRowFW,setDataBaseChange} = TableSlice.actions