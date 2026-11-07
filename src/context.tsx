import {createContext,useContext,type ReactNode} from 'react';
import type {useWorkspace} from './lib/useWorkspace';
export type Workspace=ReturnType<typeof useWorkspace>;
export const AppContext=createContext<{w:Workspace;nav:(path:string)=>void;toast:(text:string)=>void;open:(title:string,content:ReactNode)=>void;close:()=>void}>({} as never);
export const useApp=()=>useContext(AppContext);
