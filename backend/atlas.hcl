env "sqlalchemy" {
  src = "file://schema.sql"
  dev = "docker://postgres/15/dev?search_path=public"
  migration {
    dir = "file://migrations"
    revisions_schema = "public"
  }
  format {
    migrate {
      diff = "{{ sql . \"  \" }}"
    }
  }
}
