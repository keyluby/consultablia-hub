export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          accion: string
          creadoEn: string
          datosAntes: Json | null
          datosDespues: Json | null
          entidad: string
          entidadId: string
          id: string
          ipAddress: string | null
          tenantId: string
          userAgent: string | null
          usuarioId: string | null
        }
        Insert: {
          accion: string
          creadoEn?: string
          datosAntes?: Json | null
          datosDespues?: Json | null
          entidad: string
          entidadId: string
          id?: string
          ipAddress?: string | null
          tenantId: string
          userAgent?: string | null
          usuarioId?: string | null
        }
        Update: {
          accion?: string
          creadoEn?: string
          datosAntes?: Json | null
          datosDespues?: Json | null
          entidad?: string
          entidadId?: string
          id?: string
          ipAddress?: string | null
          tenantId?: string
          userAgent?: string | null
          usuarioId?: string | null
        }
        Relationships: []
      }
      certificados_digitales: {
        Row: {
          activo: boolean
          creadoEn: string
          entidadEmisora: string
          fechaEmision: string
          fechaVencimiento: string
          id: string
          nombreAlias: string
          numeroSerie: string
          sha256Fingerprint: string
          tenantId: string
          vaultSecretPath: string
        }
        Insert: {
          activo?: boolean
          creadoEn?: string
          entidadEmisora: string
          fechaEmision: string
          fechaVencimiento: string
          id?: string
          nombreAlias: string
          numeroSerie: string
          sha256Fingerprint: string
          tenantId: string
          vaultSecretPath: string
        }
        Update: {
          activo?: boolean
          creadoEn?: string
          entidadEmisora?: string
          fechaEmision?: string
          fechaVencimiento?: string
          id?: string
          nombreAlias?: string
          numeroSerie?: string
          sha256Fingerprint?: string
          tenantId?: string
          vaultSecretPath?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificados_digitales_tenantId_fkey"
            columns: ["tenantId"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      comprobantes_fiscales_electronicos: {
        Row: {
          actualizadoEn: string
          codigoErrorDgii: string | null
          creadoEn: string
          deletedAt: string | null
          eNcf: string
          estadoDgii: Database["public"]["Enums"]["EstadoEcfDgii"]
          fechaEmision: string
          fechaVencimientoPago: string | null
          id: string
          intentosEnvio: number
          itbisTotal: number
          mensajeErrorDgii: string | null
          montoExento: number
          montoGravadoI1: number
          montoGravadoI2: number
          montoItbis1: number
          montoItbis2: number
          ncfModificado: string | null
          propina: number
          razonSocialComprador: string | null
          riPdfS3Key: string | null
          rncComprador: string | null
          tenantId: string
          tipoEcf: number
          totalFacturado: number
          ultimoIntento: string | null
          xmlFirmadoS3Key: string | null
          xmlHash: string | null
        }
        Insert: {
          actualizadoEn: string
          codigoErrorDgii?: string | null
          creadoEn?: string
          deletedAt?: string | null
          eNcf: string
          estadoDgii?: Database["public"]["Enums"]["EstadoEcfDgii"]
          fechaEmision: string
          fechaVencimientoPago?: string | null
          id?: string
          intentosEnvio?: number
          itbisTotal?: number
          mensajeErrorDgii?: string | null
          montoExento?: number
          montoGravadoI1?: number
          montoGravadoI2?: number
          montoItbis1?: number
          montoItbis2?: number
          ncfModificado?: string | null
          propina?: number
          razonSocialComprador?: string | null
          riPdfS3Key?: string | null
          rncComprador?: string | null
          tenantId: string
          tipoEcf: number
          totalFacturado: number
          ultimoIntento?: string | null
          xmlFirmadoS3Key?: string | null
          xmlHash?: string | null
        }
        Update: {
          actualizadoEn?: string
          codigoErrorDgii?: string | null
          creadoEn?: string
          deletedAt?: string | null
          eNcf?: string
          estadoDgii?: Database["public"]["Enums"]["EstadoEcfDgii"]
          fechaEmision?: string
          fechaVencimientoPago?: string | null
          id?: string
          intentosEnvio?: number
          itbisTotal?: number
          mensajeErrorDgii?: string | null
          montoExento?: number
          montoGravadoI1?: number
          montoGravadoI2?: number
          montoItbis1?: number
          montoItbis2?: number
          ncfModificado?: string | null
          propina?: number
          razonSocialComprador?: string | null
          riPdfS3Key?: string | null
          rncComprador?: string | null
          tenantId?: string
          tipoEcf?: number
          totalFacturado?: number
          ultimoIntento?: string | null
          xmlFirmadoS3Key?: string | null
          xmlHash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comprobantes_fiscales_electronicos_tenantId_fkey"
            columns: ["tenantId"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      dgii_rnc_cache: {
        Row: {
          actualizadoEn: string
          estado: string
          razonSocial: string
          rnc: string
          tipo: string
          ttlVenceEn: string
        }
        Insert: {
          actualizadoEn: string
          estado: string
          razonSocial: string
          rnc: string
          tipo: string
          ttlVenceEn: string
        }
        Update: {
          actualizadoEn?: string
          estado?: string
          razonSocial?: string
          rnc?: string
          tipo?: string
          ttlVenceEn?: string
        }
        Relationships: []
      }
      documentos_processing: {
        Row: {
          archivoS3Key: string
          completadoEn: string | null
          creadoEn: string
          errorMessage: string | null
          id: string
          jobId: string
          nlpResultJson: Json | null
          ocrConfidence: number | null
          registro606Id: string | null
          status: Database["public"]["Enums"]["JobStatus"]
          tenantId: string
          tipoArchivo: string
        }
        Insert: {
          archivoS3Key: string
          completadoEn?: string | null
          creadoEn?: string
          errorMessage?: string | null
          id?: string
          jobId: string
          nlpResultJson?: Json | null
          ocrConfidence?: number | null
          registro606Id?: string | null
          status?: Database["public"]["Enums"]["JobStatus"]
          tenantId: string
          tipoArchivo: string
        }
        Update: {
          archivoS3Key?: string
          completadoEn?: string | null
          creadoEn?: string
          errorMessage?: string | null
          id?: string
          jobId?: string
          nlpResultJson?: Json | null
          ocrConfidence?: number | null
          registro606Id?: string | null
          status?: Database["public"]["Enums"]["JobStatus"]
          tenantId?: string
          tipoArchivo?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_processing_tenantId_fkey"
            columns: ["tenantId"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      items_ecf: {
        Row: {
          cantidad: number
          descripcion: string
          descuento: number
          ecfId: string
          id: string
          montoItbis: number
          orden: number
          precioUnitario: number
          subtotal: number
          tipoItbis: number
          total: number
        }
        Insert: {
          cantidad: number
          descripcion: string
          descuento?: number
          ecfId: string
          id?: string
          montoItbis?: number
          orden: number
          precioUnitario: number
          subtotal: number
          tipoItbis: number
          total: number
        }
        Update: {
          cantidad?: number
          descripcion?: string
          descuento?: number
          ecfId?: string
          id?: string
          montoItbis?: number
          orden?: number
          precioUnitario?: number
          subtotal?: number
          tipoItbis?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "items_ecf_ecfId_fkey"
            columns: ["ecfId"]
            isOneToOne: false
            referencedRelation: "comprobantes_fiscales_electronicos"
            referencedColumns: ["id"]
          },
        ]
      }
      registros_606: {
        Row: {
          actualizadoEn: string
          archivoOriginalS3: string | null
          col01RncCedula: string
          col02TipoId: number
          col03TipoBienes: number
          col04Ncf: string
          col05NcfModificado: string | null
          col06FechaComprobante: string
          col07FechaPago: string | null
          col08MontoServicios: number
          col09MontoBienes: number
          col10TotalFacturado: number
          col11ItbisFacturado: number
          col12ItbisRetenido: number
          col13ItbisProp: number
          col14ItbisCosto: number
          col15ItbisAdelantar: number
          col16ItbisPercibido: number
          col17TipoRetencionIsr: number
          col18MontoRetencionIsr: number
          col19IsrPercibido: number
          col20Isc: number
          col21OtrosImpuestos: number
          col22Propina: number
          col23FormaPago: number
          confianzaIa: number | null
          creadoEn: string
          deletedAt: string | null
          erroresJson: Json | null
          estadoValidacion: Database["public"]["Enums"]["EstadoValidacion"]
          id: string
          origen: Database["public"]["Enums"]["OrigenRegistro"]
          periodo: string
          procesadoPorJobId: string | null
          revisadoEn: string | null
          revisadoPorUsuario: boolean
          tenantId: string
        }
        Insert: {
          actualizadoEn: string
          archivoOriginalS3?: string | null
          col01RncCedula: string
          col02TipoId: number
          col03TipoBienes: number
          col04Ncf: string
          col05NcfModificado?: string | null
          col06FechaComprobante: string
          col07FechaPago?: string | null
          col08MontoServicios?: number
          col09MontoBienes?: number
          col10TotalFacturado: number
          col11ItbisFacturado?: number
          col12ItbisRetenido?: number
          col13ItbisProp?: number
          col14ItbisCosto?: number
          col15ItbisAdelantar: number
          col16ItbisPercibido?: number
          col17TipoRetencionIsr?: number
          col18MontoRetencionIsr?: number
          col19IsrPercibido?: number
          col20Isc?: number
          col21OtrosImpuestos?: number
          col22Propina?: number
          col23FormaPago: number
          confianzaIa?: number | null
          creadoEn?: string
          deletedAt?: string | null
          erroresJson?: Json | null
          estadoValidacion?: Database["public"]["Enums"]["EstadoValidacion"]
          id?: string
          origen: Database["public"]["Enums"]["OrigenRegistro"]
          periodo: string
          procesadoPorJobId?: string | null
          revisadoEn?: string | null
          revisadoPorUsuario?: boolean
          tenantId: string
        }
        Update: {
          actualizadoEn?: string
          archivoOriginalS3?: string | null
          col01RncCedula?: string
          col02TipoId?: number
          col03TipoBienes?: number
          col04Ncf?: string
          col05NcfModificado?: string | null
          col06FechaComprobante?: string
          col07FechaPago?: string | null
          col08MontoServicios?: number
          col09MontoBienes?: number
          col10TotalFacturado?: number
          col11ItbisFacturado?: number
          col12ItbisRetenido?: number
          col13ItbisProp?: number
          col14ItbisCosto?: number
          col15ItbisAdelantar?: number
          col16ItbisPercibido?: number
          col17TipoRetencionIsr?: number
          col18MontoRetencionIsr?: number
          col19IsrPercibido?: number
          col20Isc?: number
          col21OtrosImpuestos?: number
          col22Propina?: number
          col23FormaPago?: number
          confianzaIa?: number | null
          creadoEn?: string
          deletedAt?: string | null
          erroresJson?: Json | null
          estadoValidacion?: Database["public"]["Enums"]["EstadoValidacion"]
          id?: string
          origen?: Database["public"]["Enums"]["OrigenRegistro"]
          periodo?: string
          procesadoPorJobId?: string | null
          revisadoEn?: string | null
          revisadoPorUsuario?: boolean
          tenantId?: string
        }
        Relationships: [
          {
            foreignKeyName: "registros_606_tenantId_fkey"
            columns: ["tenantId"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      secuencias_ncf: {
        Row: {
          activa: boolean
          actualizadoEn: string
          autorizadaEn: string
          creadoEn: string
          id: string
          prefijo: string
          secuenciaActual: number
          secuenciaMax: number
          tenantId: string
          tipoEcf: number
          venceEn: string
        }
        Insert: {
          activa?: boolean
          actualizadoEn: string
          autorizadaEn: string
          creadoEn?: string
          id?: string
          prefijo: string
          secuenciaActual?: number
          secuenciaMax: number
          tenantId: string
          tipoEcf: number
          venceEn: string
        }
        Update: {
          activa?: boolean
          actualizadoEn?: string
          autorizadaEn?: string
          creadoEn?: string
          id?: string
          prefijo?: string
          secuenciaActual?: number
          secuenciaMax?: number
          tenantId?: string
          tipoEcf?: number
          venceEn?: string
        }
        Relationships: [
          {
            foreignKeyName: "secuencias_ncf_tenantId_fkey"
            columns: ["tenantId"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          actividadEconomica: string | null
          actualizadoEn: string
          configuracion: Json
          creadoEn: string
          deletedAt: string | null
          direccion: string | null
          emailFiscal: string
          esEmisorElectronico: boolean
          estadoRnc: Database["public"]["Enums"]["EstadoRnc"]
          fechaCertificacionEcf: string | null
          id: string
          nombreComercial: string | null
          planSuscripcion: Database["public"]["Enums"]["PlanSuscripcion"]
          planVenceEn: string | null
          razonSocial: string
          rnc: string
          telefono: string | null
          tipoContribuyente: Database["public"]["Enums"]["TipoContribuyente"]
        }
        Insert: {
          actividadEconomica?: string | null
          actualizadoEn: string
          configuracion?: Json
          creadoEn?: string
          deletedAt?: string | null
          direccion?: string | null
          emailFiscal: string
          esEmisorElectronico?: boolean
          estadoRnc?: Database["public"]["Enums"]["EstadoRnc"]
          fechaCertificacionEcf?: string | null
          id?: string
          nombreComercial?: string | null
          planSuscripcion?: Database["public"]["Enums"]["PlanSuscripcion"]
          planVenceEn?: string | null
          razonSocial: string
          rnc: string
          telefono?: string | null
          tipoContribuyente: Database["public"]["Enums"]["TipoContribuyente"]
        }
        Update: {
          actividadEconomica?: string | null
          actualizadoEn?: string
          configuracion?: Json
          creadoEn?: string
          deletedAt?: string | null
          direccion?: string | null
          emailFiscal?: string
          esEmisorElectronico?: boolean
          estadoRnc?: Database["public"]["Enums"]["EstadoRnc"]
          fechaCertificacionEcf?: string | null
          id?: string
          nombreComercial?: string | null
          planSuscripcion?: Database["public"]["Enums"]["PlanSuscripcion"]
          planVenceEn?: string | null
          razonSocial?: string
          rnc?: string
          telefono?: string | null
          tipoContribuyente?: Database["public"]["Enums"]["TipoContribuyente"]
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          actualizadoEn: string
          apellido: string
          avatarUrl: string | null
          creadoEn: string
          deletedAt: string | null
          email: string
          id: string
          mfaEnabled: boolean
          mfaSecret: string | null
          nombre: string
          passwordHash: string
          telefono: string | null
          ultimoLogin: string | null
        }
        Insert: {
          actualizadoEn: string
          apellido: string
          avatarUrl?: string | null
          creadoEn?: string
          deletedAt?: string | null
          email: string
          id?: string
          mfaEnabled?: boolean
          mfaSecret?: string | null
          nombre: string
          passwordHash: string
          telefono?: string | null
          ultimoLogin?: string | null
        }
        Update: {
          actualizadoEn?: string
          apellido?: string
          avatarUrl?: string | null
          creadoEn?: string
          deletedAt?: string | null
          email?: string
          id?: string
          mfaEnabled?: boolean
          mfaSecret?: string | null
          nombre?: string
          passwordHash?: string
          telefono?: string | null
          ultimoLogin?: string | null
        }
        Relationships: []
      }
      usuarios_tenants: {
        Row: {
          activo: boolean
          creadoEn: string
          id: string
          rol: Database["public"]["Enums"]["RolUsuario"]
          tenantId: string
          usuarioId: string
        }
        Insert: {
          activo?: boolean
          creadoEn?: string
          id?: string
          rol: Database["public"]["Enums"]["RolUsuario"]
          tenantId: string
          usuarioId: string
        }
        Update: {
          activo?: boolean
          creadoEn?: string
          id?: string
          rol?: Database["public"]["Enums"]["RolUsuario"]
          tenantId?: string
          usuarioId?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_tenants_tenantId_fkey"
            columns: ["tenantId"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuarios_tenants_usuarioId_fkey"
            columns: ["usuarioId"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      EstadoEcfDgii:
        | "PENDIENTE"
        | "ENVIADO"
        | "RECIBIDO"
        | "EN_PROCESO"
        | "COMPLETADO"
        | "RECHAZADO"
        | "ANULADO"
      EstadoRnc: "ACTIVO" | "INACTIVO" | "SUSPENDIDO" | "FALLECIDO"
      EstadoValidacion:
        | "PENDIENTE"
        | "VALIDADO"
        | "CON_ERROR"
        | "EXCLUIDO"
        | "INCLUIDO"
      JobStatus:
        | "QUEUED"
        | "OCR_PROCESSING"
        | "OCR_DONE"
        | "NLP_PROCESSING"
        | "NLP_DONE"
        | "VALIDATING"
        | "COMPLETED"
        | "FAILED"
      OrigenRegistro: "OCR_IMAGEN" | "OCR_PDF" | "ECF_ELECTRONICO" | "MANUAL"
      PlanSuscripcion: "STARTER" | "PROFESIONAL" | "CONTADOR" | "ENTERPRISE"
      RolUsuario: "ADMIN" | "CONTADOR" | "ASISTENTE" | "READONLY"
      TipoContribuyente:
        | "GRANDE_NACIONAL"
        | "GRANDE_LOCAL"
        | "MEDIANO"
        | "PEQUENO"
        | "MICRO"
        | "NO_CLASIFICADO"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      EstadoEcfDgii: [
        "PENDIENTE",
        "ENVIADO",
        "RECIBIDO",
        "EN_PROCESO",
        "COMPLETADO",
        "RECHAZADO",
        "ANULADO",
      ],
      EstadoRnc: ["ACTIVO", "INACTIVO", "SUSPENDIDO", "FALLECIDO"],
      EstadoValidacion: [
        "PENDIENTE",
        "VALIDADO",
        "CON_ERROR",
        "EXCLUIDO",
        "INCLUIDO",
      ],
      JobStatus: [
        "QUEUED",
        "OCR_PROCESSING",
        "OCR_DONE",
        "NLP_PROCESSING",
        "NLP_DONE",
        "VALIDATING",
        "COMPLETED",
        "FAILED",
      ],
      OrigenRegistro: ["OCR_IMAGEN", "OCR_PDF", "ECF_ELECTRONICO", "MANUAL"],
      PlanSuscripcion: ["STARTER", "PROFESIONAL", "CONTADOR", "ENTERPRISE"],
      RolUsuario: ["ADMIN", "CONTADOR", "ASISTENTE", "READONLY"],
      TipoContribuyente: [
        "GRANDE_NACIONAL",
        "GRANDE_LOCAL",
        "MEDIANO",
        "PEQUENO",
        "MICRO",
        "NO_CLASIFICADO",
      ],
    },
  },
} as const
