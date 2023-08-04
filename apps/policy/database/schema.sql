CREATE TABLE MESSAGE(
    message_id INT IDENTITY(1, 1) UNIQUE,
    message_type varchar(255) NOT NULL,
    message_data nvarchar(max) NOT NULL,
    date_created datetime NOT NULL,
    room_id int,
    agent_type varchar(255) NOT NULL,
    pixel varchar(255) NOT NULL,
    input text,
    output text,
    feedback_text text,
    feedback_date datetime,
    rating bit,
    isActive bit,
    sessionId varchar(255) NOT NULL,
    projectId varchar(255) NOT NULL,
    user_id varchar(255) NOT NULL
);

CREATE TABLE ROOM (
    room_id INT IDENTITY(1, 1) UNIQUE,
    room_name varchar(255) NOT NULL,
    room_description varchar(255),
    room_config_data nvarchar(max),
    user_id varchar(255) NOT NULL,
    agent_type varchar(255) NOT NULL,
    isActive bit,
    date_created datetime NOT NULL,
    projectId varchar(255) NOT NULL,
);

CREATE TABLE AGENT (
    agent_id INT IDENTITY(1, 1),
    agent_name varchar(255) NOT NULL,
    description varchar(255) NOT NULL,
    agent_type varchar(255),
    context nvarchar(max),
    marketplace bit
)