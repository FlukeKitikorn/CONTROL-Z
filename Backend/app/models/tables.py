"""SQLModel ตารางตามสคีมา control_z (docs/mysql-data-dictionary-and-seed.sql)."""

from datetime import datetime
from typing import Optional

from sqlalchemy import Column, Integer, text
from sqlalchemy.dialects.mysql import DATETIME
from sqlmodel import Field, SQLModel


class Organization(SQLModel, table=True):
    __tablename__ = "organizations"

    organization_id: Optional[int] = Field(default=None, primary_key=True)
    name_of_agency: str = Field(max_length=50)
    organization_name: str = Field(max_length=50)
    address1: str = Field(max_length=100)
    subdistrict: str = Field(max_length=50)
    district: str = Field(max_length=50)
    province: str = Field(max_length=50)
    postal_code: str = Field(max_length=50)
    phone: str = Field(max_length=50)
    email: str = Field(max_length=50)
    logo: Optional[str] = Field(default=None, max_length=100)
    organization_image: Optional[str] = Field(default=None, max_length=50)
    organization_map: Optional[str] = Field(default=None, max_length=50)
    organ_structure: Optional[str] = Field(default=None, max_length=50)
    registration_date: str = Field(max_length=50)
    created_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(
            DATETIME(fsp=6),
            nullable=False,
            server_default=text("CURRENT_TIMESTAMP(6)"),
        ),
    )
    updated_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(
            DATETIME(fsp=6),
            nullable=False,
            server_default=text("CURRENT_TIMESTAMP(6)"),
            server_onupdate=text("CURRENT_TIMESTAMP(6)"),
        ),
    )


class User(SQLModel, table=True):
    __tablename__ = "users"

    user_id: Optional[int] = Field(default=None, primary_key=True)
    organization_id: int = Field(foreign_key="organizations.organization_id")
    prefix: str = Field(max_length=50)
    firstname: str = Field(max_length=50)
    lastname: str = Field(max_length=50)
    address: str = Field(max_length=100)
    subdistrict: str = Field(max_length=50)
    district: str = Field(max_length=50)
    province: str = Field(max_length=50)
    postal_code: str = Field(max_length=50)
    phone: Optional[str] = Field(default=None, max_length=50)
    email: Optional[str] = Field(default=None, max_length=50)
    image: Optional[str] = Field(default=None, max_length=100)
    created_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(
            DATETIME(fsp=6),
            nullable=False,
            server_default=text("CURRENT_TIMESTAMP(6)"),
        ),
    )
    updated_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(
            DATETIME(fsp=6),
            nullable=False,
            server_default=text("CURRENT_TIMESTAMP(6)"),
            server_onupdate=text("CURRENT_TIMESTAMP(6)"),
        ),
    )


class UserPrivilege(SQLModel, table=True):
    __tablename__ = "user_privileges"

    upid: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.user_id", unique=True)
    uname: str = Field(max_length=50, unique=True)
    password_hash: str = Field(max_length=255)
    uread: int = Field(default=0)
    uwrite: int = Field(default=0)
    uedit: int = Field(default=0)
    uall: int = Field(default=0)
    created_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(
            DATETIME(fsp=6),
            nullable=False,
            server_default=text("CURRENT_TIMESTAMP(6)"),
        ),
    )
    updated_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(
            DATETIME(fsp=6),
            nullable=False,
            server_default=text("CURRENT_TIMESTAMP(6)"),
            server_onupdate=text("CURRENT_TIMESTAMP(6)"),
        ),
    )


class GhgtForm(SQLModel, table=True):
    __tablename__ = "forms"

    fid: Optional[int] = Field(default=None, primary_key=True)
    form_id: str = Field(max_length=50)
    name: str = Field(max_length=100)
    version: str = Field(max_length=50)
    version_date: str = Field(max_length=50)
    create_date: Optional[str] = Field(default=None, max_length=50)
    end_date: Optional[str] = Field(default=None, max_length=50)
    organization_id: int = Field(foreign_key="organizations.organization_id")
    created_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(
            DATETIME(fsp=6),
            nullable=False,
            server_default=text("CURRENT_TIMESTAMP(6)"),
        ),
    )
    updated_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(
            DATETIME(fsp=6),
            nullable=False,
            server_default=text("CURRENT_TIMESTAMP(6)"),
            server_onupdate=text("CURRENT_TIMESTAMP(6)"),
        ),
    )


class EditForm(SQLModel, table=True):
    __tablename__ = "edit_forms"

    efid: Optional[int] = Field(default=None, primary_key=True)
    fid: int = Field(foreign_key="forms.fid")
    user_id: int = Field(foreign_key="users.user_id")
    edit_date: str = Field(max_length=50)


class FormDetail(SQLModel, table=True):
    __tablename__ = "form_details"

    fdid: Optional[int] = Field(default=None, primary_key=True)
    fid: int = Field(foreign_key="forms.fid")
    subject: str = Field(max_length=100)
    description: str = Field(max_length=150)
    created_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(
            DATETIME(fsp=6),
            nullable=False,
            server_default=text("CURRENT_TIMESTAMP(6)"),
        ),
    )
    updated_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(
            DATETIME(fsp=6),
            nullable=False,
            server_default=text("CURRENT_TIMESTAMP(6)"),
            server_onupdate=text("CURRENT_TIMESTAMP(6)"),
        ),
    )


class OrganizationInformation(SQLModel, table=True):
    __tablename__ = "organization_information"

    ogid: Optional[int] = Field(default=None, primary_key=True)
    organization_id: int = Field(foreign_key="organizations.organization_id")
    description: str = Field(max_length=300)
    created_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(
            DATETIME(fsp=6),
            nullable=False,
            server_default=text("CURRENT_TIMESTAMP(6)"),
        ),
    )
    updated_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(
            DATETIME(fsp=6),
            nullable=False,
            server_default=text("CURRENT_TIMESTAMP(6)"),
            server_onupdate=text("CURRENT_TIMESTAMP(6)"),
        ),
    )


class CollectInformation(SQLModel, table=True):
    __tablename__ = "collect_information"

    ciid: Optional[int] = Field(default=None, primary_key=True)
    organization_id: int = Field(foreign_key="organizations.organization_id")
    period_collection: str = Field(max_length=100)
    productivity: float
    unit_productivity: str = Field(max_length=100)
    base_year: str = Field(max_length=100)
    base_year_output: float
    unit_base_output: str = Field(max_length=100)
    created_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(
            DATETIME(fsp=6),
            nullable=False,
            server_default=text("CURRENT_TIMESTAMP(6)"),
        ),
    )
    updated_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(
            DATETIME(fsp=6),
            nullable=False,
            server_default=text("CURRENT_TIMESTAMP(6)"),
            server_onupdate=text("CURRENT_TIMESTAMP(6)"),
        ),
    )


class Scope(SQLModel, table=True):
    __tablename__ = "scope"

    scid: Optional[int] = Field(default=None, primary_key=True)
    description: str = Field(max_length=100)


class SubjectScope(SQLModel, table=True):
    __tablename__ = "subject_scope"

    subid: Optional[int] = Field(default=None, primary_key=True)
    scid: int = Field(foreign_key="scope.scid")
    organization_id: int = Field(foreign_key="organizations.organization_id")
    fid: int = Field(foreign_key="forms.fid")
    description: str = Field(max_length=100)
    created_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(
            DATETIME(fsp=6),
            nullable=False,
            server_default=text("CURRENT_TIMESTAMP(6)"),
        ),
    )
    updated_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(
            DATETIME(fsp=6),
            nullable=False,
            server_default=text("CURRENT_TIMESTAMP(6)"),
            server_onupdate=text("CURRENT_TIMESTAMP(6)"),
        ),
    )


class DetailsScope(SQLModel, table=True):
    __tablename__ = "details_scope"

    osid: Optional[int] = Field(default=None, primary_key=True)
    subid: int = Field(foreign_key="subject_scope.subid")
    description: str = Field(max_length=300)
    created_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(
            DATETIME(fsp=6),
            nullable=False,
            server_default=text("CURRENT_TIMESTAMP(6)"),
        ),
    )
    updated_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(
            DATETIME(fsp=6),
            nullable=False,
            server_default=text("CURRENT_TIMESTAMP(6)"),
            server_onupdate=text("CURRENT_TIMESTAMP(6)"),
        ),
    )


class PointsConsider(SQLModel, table=True):
    __tablename__ = "points_consider"

    pid: Optional[int] = Field(default=None, primary_key=True)
    organization_id: int = Field(foreign_key="organizations.organization_id")
    fid: int = Field(foreign_key="forms.fid")
    source_GHG: str = Field(max_length=500)
    magnitude: str = Field(max_length=500)
    influence: str = Field(max_length=500)
    risk: str = Field(max_length=500)
    sector: str = Field(max_length=500)
    outsourcing: str = Field(max_length=500)
    engagement: str = Field(max_length=500)
    created_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(
            DATETIME(fsp=6),
            nullable=False,
            server_default=text("CURRENT_TIMESTAMP(6)"),
        ),
    )
    updated_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(
            DATETIME(fsp=6),
            nullable=False,
            server_default=text("CURRENT_TIMESTAMP(6)"),
            server_onupdate=text("CURRENT_TIMESTAMP(6)"),
        ),
    )


class Category(SQLModel, table=True):
    __tablename__ = "category"

    cid: Optional[int] = Field(default=None, primary_key=True)
    fid: int = Field(foreign_key="forms.fid")
    description: str = Field(max_length=100)
    created_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(
            DATETIME(fsp=6),
            nullable=False,
            server_default=text("CURRENT_TIMESTAMP(6)"),
        ),
    )
    updated_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(
            DATETIME(fsp=6),
            nullable=False,
            server_default=text("CURRENT_TIMESTAMP(6)"),
            server_onupdate=text("CURRENT_TIMESTAMP(6)"),
        ),
    )


class CategoryAnswer(SQLModel, table=True):
    __tablename__ = "category_anwser"

    caid: Optional[int] = Field(default=None, primary_key=True)
    cid: int = Field(foreign_key="category.cid")
    organization_id: int = Field(foreign_key="organizations.organization_id")
    source_GHG: int
    magnitude: int
    influence: int
    risk: int
    sector: int
    outsourcing: int
    engagement: int
    remark: Optional[str] = Field(default=None, max_length=300)
    created_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(
            DATETIME(fsp=6),
            nullable=False,
            server_default=text("CURRENT_TIMESTAMP(6)"),
        ),
    )
    updated_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(
            DATETIME(fsp=6),
            nullable=False,
            server_default=text("CURRENT_TIMESTAMP(6)"),
            server_onupdate=text("CURRENT_TIMESTAMP(6)"),
        ),
    )


class Fr041Detail(SQLModel, table=True):
    __tablename__ = "fr04_1_detail"

    fr04wid: Optional[int] = Field(default=None, primary_key=True)
    subid: int = Field(foreign_key="subject_scope.subid")
    value: float
    unit: str = Field(max_length=10)
    co2_ef: Optional[float] = None
    fossil_ch4_ef: Optional[float] = None
    ch4_ef: Optional[float] = None
    n2o_ef: Optional[float] = None
    sf6_ef: Optional[float] = None
    nf3_ef: Optional[float] = None
    hfcs_ef: Optional[float] = None
    pfcs_ef: Optional[float] = None
    hfcs_gwp: Optional[float] = None
    pfcs_gwp: Optional[float] = None
    ef_unit: Optional[float] = None
    gwp_unit: Optional[float] = None
    kgco2e_total: Optional[float] = None
    self_collct: Optional[int] = None
    supplier: Optional[int] = None
    th_lci_db: Optional[int] = None
    tgo_ef: Optional[int] = None
    thai_res: Optional[int] = None
    int_db: Optional[int] = None
    other: Optional[int] = Field(default=None, sa_column=Column("Other", Integer, nullable=True))
    substitute: Optional[int] = None
    reference: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = Field(default=None, max_length=100)
    created_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(
            DATETIME(fsp=6),
            nullable=False,
            server_default=text("CURRENT_TIMESTAMP(6)"),
        ),
    )
    updated_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(
            DATETIME(fsp=6),
            nullable=False,
            server_default=text("CURRENT_TIMESTAMP(6)"),
            server_onupdate=text("CURRENT_TIMESTAMP(6)"),
        ),
    )


class Gwp(SQLModel, table=True):
    __tablename__ = "gwp"

    gwpid: Optional[int] = Field(default=None, primary_key=True)
    subject: str = Field(max_length=100)
    value: str = Field(max_length=100)
