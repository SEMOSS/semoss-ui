import os
import pickle
import datetime

import numpy as np
import pandas as pd

import openai
import tiktoken
import streamlit as st

import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)
warnings.simplefilter(action='ignore', category=FutureWarning)
warnings.warn("deprecated", DeprecationWarning)

EMBEDDING_MODEL = "text-embedding-ada-002"
# Add your OpenAI API key here
openai.api_key = "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"


# Compute embedding for a text string using an embedding model (default: 'text-embedding-ada-002').
def get_embedding(text: str, model: str = EMBEDDING_MODEL) -> list[float]:
    """
    Input: A text string.
    Output: The word embedding for the text string using the model defined in EMBEDDING_MODEL (default: 'text-embedding-ada-002').
    """
    result = openai.Embedding.create(model=model, input=text)
    return result["data"][0]["embedding"]


# Calculate the vector similarity between two text strings
def vector_similarity(x: list[float], y: list[float]) -> float:
    """
    Input: Two lists x & y. Each list contains the embeddings of a text string.
    Output: Dot product (a float) of x & y (parsed as NumPy arrays).
            NOTE: Since OpenAI embeddings are normalized to length 1, the dot product is equivalent to the cosine similarity.
    """
    return np.dot(np.array(x), np.array(y))


def order_document_sections_by_query_similarity(query: str, contexts: dict[(str, str), np.array]) -> list[(float, (str, str))]:
    """
    Input: The user-query text (string) and the content of all documents (context) along with their word embeddings (dict).
    Output: A list of the most similar chunks of text according to vector similarity between the embeddings of the query-text and the context.
    """
    # Compute the word embeddings of the user-query
    query_embedding = get_embedding(query)
    # Compute the similarity between different chunks of the input documents and the user-query and store the same in a list sorted in descending order of similarity.
    document_similarities = sorted([(vector_similarity(query_embedding, doc_embedding), doc_index)
                                    for doc_index, doc_embedding in contexts.items()],
                                   reverse=True)
    return document_similarities


def construct_prompt_para(question: str, context_embeddings: dict, 
                          input_df: pd.DataFrame, diagnostics=False) -> str:
    """
    Input: User query, word embeddings of all the documents, dataframe of the input documents.
    Output: Final prompt sent to the GPT model that contains instructions as well as context.
    """
    MAX_CONTEXT_LEN = context_length
    SEPARATOR = "\n* "
    ENCODING = "gpt2"  # encoding for text-davinci-003, which is our completions model
    encoding = tiktoken.get_encoding(ENCODING)
    separator_len = len(encoding.encode(SEPARATOR))

    most_relevant_document_sections = order_document_sections_by_query_similarity(question, context_embeddings)

    chosen_sections = []
    chosen_sections_len = 0
    chosen_sections_indices = []
    if diagnostics:
        chosen_sections_similarities = []

    # Loop to add chunks from our input documents as context until we hit the maximum token limit specified in MAX_CONTEXT_LEN (determined by the choice of model used for completions)
    for score, section_index in most_relevant_document_sections:
        # Read each chunk of the input document (i.e. one row of the input df)
        document_section = input_df.loc[section_index, :]
        # Add the number of tokens from the current chunk into the prompt token counter
        chosen_sections_len += document_section.tokens + separator_len
        # Break from the loop once the length of all sections chosen exceeds the maximum token limit
        if chosen_sections_len > MAX_CONTEXT_LEN:
            break

        # Extract metadata about the current section
        underscore_idx = [i for i in range(
            len(section_index)) if section_index[i] == '_']
        document_name = str(section_index[:underscore_idx[0]]).upper()
        # print(section_index)
        page_number = str(section_index[(underscore_idx[0]+1):underscore_idx[1]])
        # Extract and shorten URL
        url = str(document_section.url)
        document_index = f"Document Name: {document_name}, Page Number: {page_number}, Document URL: {url}\n"
        # Store all chunks selected to form the prompt's context in a list along with the separator string for each chunk
        chosen_sections.append(
            SEPARATOR + document_index + document_section.content.replace('\n', ' '))
        # Stores the indentifying index of each selected document chunk in a list
        chosen_sections_indices.append(str(section_index))
        if diagnostics:
            underscore_idx = [i for i in range(
                len(section_index)) if section_index[i] == '_']
            section_str = str(section_index[:underscore_idx[0]].upper()
                              + ', pg.' + section_index[(underscore_idx[0]+1):underscore_idx[1]]
                              + " (Similarity = " + str(score) + ')')
            chosen_sections_similarities.append(section_str)

    if diagnostics:
        # Prints diagnostic information regarding the selected chunks
        print(
            f"Selected {len(chosen_sections)} document sections! Section IDs are:")
        print("\n".join(chosen_sections_similarities))

    sources = {}
    for section_index in chosen_sections_indices:
        underscore_idx = [i for i in range(
            len(section_index)) if section_index[i] == '_']
        section_str = str(section_index[:underscore_idx[0]].upper()
                          + ', pg.' + section_index[(underscore_idx[0]+1):underscore_idx[1]])
        sources[section_str] = input_df.loc[input_df.index == section_index, "url"].item()

    # Defines the prompt header that is appended prior to the context. GPT is instructed to answer truthfully if the relevant context is not provided.
    context_header = "A context delimited by triple backticks is provided below. This context may contain plain text extracted from paragraphs or images. Tables extracted are represented as a 2D list in the following format - '[[Column Headers], [Comma-separated values in row 1], [Comma-separated values in row 2] ..... [Comma-separated values in row n]]'\n"
    footer = """Answer the user's question truthfully using the context only. Use the following section-wise format (in the order given) to answer the question with instructions for each section in angular brackets:
                Reasoning:
                <State your reasoning step-wise in bullet points. Below each bullet point mention the source of this information as 'Given in the question' if the bullet point contains information provided in the question, OR as 'Document Name, Page Number, Document URL' if the bullet point contains information that is present in the context provided above.>
                Conclusion:
                <Write a short concluding paragraph stating the final answer and explaining the reasoning behind it briefly. State caveats and exceptions to your answer if any.>
                Information required to provide a better answer:
                <If you cannot provide an answer based on the context above, mention the additional information that you require to answer the question fully as a list.>"""
    disclaimer = "Do not compromise on your mathematical and reasoning abilities to fit the user's instructions. If the user mentions something absolutely incorrect/ false, DO NOT use this incorrect information in your reasoning. Also, please correct the user gently."
    context = " ".join(chosen_sections)
    prompt_with_context = context_header + f"```{context}```" + \
                          "\n" + footer + disclaimer
    return prompt_with_context, sources


def answer_query_with_context_using_gpt4_and_streaming(messages: list, sources: dict, 
                                                       temp: float, max_token: int, 
                                                       show_prompt=False):
    """
    Input: The constructed prompt with the relevant context and the user-query
    Output: GPT-4's response to the user query given the relevant context, without any hallucination or creativity. No metadata returned.
    """
    try:
        if show_prompt:
            print("\nMessages:\n", messages)

        response = openai.ChatCompletion.create(model=MODEL, messages=messages, 
                                                temperature=temp, max_tokens=max_token)
        answer = response["choices"][0]["message"]["content"]

        further_reading = ""
        doc_names = list(set([doc_name[:doc_name.find(", pg.")].strip() for doc_name in sources.keys()]))
        for sr_no, doc_name in enumerate(doc_names, start=1):
            pages = [source[source.find("pg."):] 
                     for source in sources.keys() 
                     if doc_name in source]
            url = str([source_url for source_name, source_url in sources.items() 
                       if doc_name in source_name][0])
            further_reading += f"""{sr_no}. {doc_name}: {", ".join(pages)}\n\n   Link: {url}\n"""
        return answer, further_reading
    except (openai.error.APIError, openai.error.ServiceUnavailableError):
        return "Error! OpenAI GPT server busy! Please retry after a few minutes.", ""
    except openai.error.AuthenticationError:
        return "Error! API Key invalid/ expired! Please check your API key.", ""
    except openai.error.APIConnectionError:
        return "Error! Unable to connect to GPT server! Please check your internet connection and firewall/ proxy settings.", ""
    except (openai.error.Timeout, openai.error.RateLimitError):
        return "Error! Request timed-out! Please retry after a few minutes.", ""
    

def translate_text_using_gpt4(text: str, language: str, max_token: int):
    """
    Input: English text to be translate and the language to be translated into.
    Output: GPT-4 translated text.
    """
    try:
        translate_messages = [{"role": "system", "content": text},
                                {"role": "user", "content": f"Translate the text above in {language}"}]
        response = openai.ChatCompletion.create(model="gpt-3.5-turbo", messages=translate_messages, 
                                                temperature=0, max_tokens=max_token)
        return response["choices"][0]["message"]["content"]
    except (openai.error.APIError, openai.error.ServiceUnavailableError):
        raise Exception("Error! OpenAI GPT server busy! Please retry after a few minutes.")
    except openai.error.AuthenticationError:
        raise Exception("Error! API Key invalid/ expired! Please check your API key.")
    except openai.error.APIConnectionError:
        raise Exception("Error! Unable to connect to GPT server! Please check your internet connection and firewall/ proxy settings.")
    except (openai.error.Timeout, openai.error.RateLimitError):
        raise Exception("Error! Request timed-out! Please retry after a few minutes.")


def answer_query_with_context_using_gpt4_and_intent_creation(query, temp, max_token):
    """
    Input: the user-query
    Output: GPT-4's response to the user query.
    """
    try:
        messages = [{"role": "system", "content": "You are an intellgent AI assistant employed by Deloitte to help craft government proposal responses.\
                                                 You answer as truthfully as possible at all times and tell the user if you do not know the answer."},
                    {"role": "user", "content": query}]
        response = openai.ChatCompletion.create(
            model="gpt-4", messages=messages, temperature=temp, max_tokens=max_token, stream=True)
        # st.write("**Generated Answer:**")
        s = ""
        placeholder = st.empty()
        for event in response:
            placeholder.empty()
            event_token = event["choices"][0]["delta"]
            event_text = event_token.get("content", '')
            if event_text != '\n':
                text = ''.join(event_text)
            else:
                text = '\n'
            s += text
            placeholder.write(s)
        return response
    except (openai.error.APIError, openai.error.ServiceUnavailableError):
        print("OpenAI GPT server busy! Please retry after a few minutes.")
    except openai.error.AuthenticationError:
        print("API Key invalid/ expired! Please check your API key.")
    except openai.error.APIConnectionError:
        print("Unable to connect to GPT server! Please check your internet connection and firewall/ proxy settings.")
    except (openai.error.Timeout, openai.error.RateLimitError):
        print("Request timed-out! Please retry after a few minutes.")


# def answer_query_with_context_using_gpt35(prompt, query, temp, max_token, show_prompt=False):
#     """
#     Input: The constructed prompt with the relevant context and the user-query
#     Output: GPT-4's response to the user query given the relevant context, without any hallucination or creativity. No metadata returned.
#     """
#     try:
#         if show_prompt:
#             print(prompt)

#         messages=[{"role": "system", "content": "You are an intellgent AI assistant employed by Deloitte to help craft government proposal responses.\
#                                                  You answer as truthfully as possible at all times and tell the user if you do not know the answer."},
#                   {"role": "user", "content": prompt},
#                   {"role": "user", "content": query}]
#         response = openai.ChatCompletion.create(model=MODEL, messages=messages, temperature=temp, max_tokens=max_token)
#         return response["choices"][0]["message"]["content"]
#     except (openai.error.APIError, openai.error.ServiceUnavailableError):
#         print("OpenAI GPT server busy! Please retry after a few minutes.")
#     except openai.error.AuthenticationError:
#         print("API Key invalid/ expired! Please check your API key.")
#     except openai.error.APIConnectionError:
#         print("Unable to connect to GPT server! Please check your internet connection and firewall/ proxy settings.")
#     except (openai.error.Timeout, openai.error.RateLimitError):
#         print("Request timed-out! Please retry after a few minutes.")


def answer_query_with_context_using_gpt35(prompt, show_prompt=False):
    """
    Input: The constructed prompt with the relevant context and the user-query
    Output: GPT-4's response to the user query given the relevant context, without any hallucination or creativity. No metadata returned.
    """
    try:
        if show_prompt:
            print(prompt)
        messages = [
            {"role": "system", "content": "You are an intellgent AI assistant employed by Deloitte to help craft government proposal responses.\
       You answer as truthfully as possible at all times and tell the user if you do not know the answer."},
            {"role": "user", "content": prompt}
        ]

        response = openai.ChatCompletion.create(
            model=MODEL, messages=messages, temperature=temp, max_tokens=max_token)
        return response["choices"][0]["message"]["content"]
    except (openai.error.APIError, openai.error.ServiceUnavailableError):
        print("OpenAI GPT server busy! Please retry after a few minutes.")
    except openai.error.AuthenticationError:
        print("API Key invalid/ expired! Please check your API key.")
    except openai.error.APIConnectionError:
        print("Unable to connect to GPT server! Please check your internet connection and firewall/ proxy settings.")
    except (openai.error.Timeout, openai.error.RateLimitError):
        print("Request timed-out! Please retry after a few minutes.")


def create_validation_para(query, answer):
    """
    Input: The constructed prompt with the relevant context and the user-query
    Output: GPT-4's response to the user query given the relevant context, without any hallucination or creativity. No metadata returned.
    """
    answer = answer.split(":")[2]
    header = "Check if the following statement is true and respond only with True or False or Unsure along with the confidence score. "
    validation_para = header + "Question: " + query + "." + " Answer: " + answer
    return validation_para


def answer_query_with_context_using_gpt4_and_test_validation(validation, temp, max_token):
    """
    Input: The constructed prompt with the relevant context and the user-query
    Output: GPT-4's response to the user query given the relevant context, without any hallucination or creativity. No metadata returned.
    """
    try:
        messages = [
            {"role": "system", "content": "You are an intellgent AI assistant employed by Deloitte to help craft government proposal responses.\
             You answer as truthfully as possible at all times and tell the user if you do not know the answer."},
            {"role": "user", "content": validation}
        ]
        response = openai.ChatCompletion.create(
            model=MODEL, messages=messages, temperature=temp, max_tokens=max_token)
        return response["choices"][0]["message"]["content"]
    except (openai.error.APIError, openai.error.ServiceUnavailableError):
        print("OpenAI GPT server busy! Please retry after a few minutes.")
    except openai.error.AuthenticationError:
        print("API Key invalid/ expired! Please check your API key.")
    except openai.error.APIConnectionError:
        print("Unable to connect to GPT server! Please check your internet connection and firewall/ proxy settings.")
    except (openai.error.Timeout, openai.error.RateLimitError):
        print("Request timed-out! Please retry after a few minutes.")


# def answer_query_with_context_using_gpt4_and_streaming(prompt, sections, sources, temp, max_token, show_prompt=False):
#     """
#     Input: The constructed prompt with the relevant context and the user-query
#     Output: GPT-4's response to the user query given the relevant context, without any hallucination or creativity. No metadata returned.
#     """
#     try:
#         if show_prompt:
#             print(prompt)

#         terminologies = """
#                 Explanations of some terminologies used in questions/ policy documents are given below:
#                 1. All Programs: All Programs refer to Food Assistance Program, Medicaid, CDC, SER and FIP (TANF).
#                 2. Food Assistance Program (FAP): SNAP is referred to as FAP in Michigan.
#                 """
#         messages = [
#             {"role": "system", "content": "You are an intellgent AI assistant helps to provide responses from policy manuals.\
#              You answer as truthfully as possible at all times and tell the user if you do not know the answer."},
#             {"role": "system", "content": terminologies.strip()},
#             {"role": "user", "content": prompt}
#         ]
#         response = openai.ChatCompletion.create(
#             model=MODEL, messages=messages, temperature=temp, max_tokens=max_token)
#         # print(response)
#         # s = ""
#         # placeholder = st.empty()
#         # for event in response:
#         #     placeholder.empty()
#         #     event_token = event["choices"][0]["delta"]
#         #     event_text = event_token.get("content", '')
#         #     if event_text != '\n':
#         #         text = ''.join(event_text)
#         #     else:
#         #         text = '\n'
#         #     s += text
#         #     placeholder.write(s)
#         answer = response["choices"][0]["message"]["content"]
#         print(answer)
#         reasoning = "Not Applicable"
#         additional_info = "Not Applicable"
#         conclusion = "Sorry, I am not sure of the answer to your question. Kindly consult with the appropriate agency for further assistance."
#         if "Reasoning:" in answer:
#             answer = answer.split("Reasoning:")[1]
#             if "Conclusion:" in answer:
#                 reasoning = answer.split("Conclusion:")[0].strip("\n ")
#                 conclusion = answer.split("Conclusion:")[1]
#                 if "Information required to provide a better answer:" in conclusion:
#                     additional_info = conclusion.split("Information required to provide a better answer:")[1].strip("\n ")
#                     if "None" or "No additional information" in additional_info:
#                         additional_info = "Not Applicable"
#                     conclusion = conclusion.split("Information required to provide a better answer:")[0].strip("\n ")
#                 else:
#                     conclusion = conclusion.strip("\n ")
#             else:
#                 reasoning = answer.strip("\n ")
#         st.write(conclusion)
#         if reasoning != "I am not able to reason the user query.":
#             st.write("**Reasoning:**")
#             st.write(reasoning)
#             st.write("**Information required to provide a better answer:**")
#             st.write(additional_info)
#             st.write("**For Relevant Reading**")
#             for sr_no, url in enumerate(sources, start=1):
#                 doc_name = url[46:49] + "-" + url[50:-4]
#                 source_names_to_print = [source_name[source_name.find("pg."):] for source_name in sections if doc_name in source_name]
#                 st.write(f"{sr_no}. " + doc_name + ": " + ", ".join(source_names_to_print))
#                 st.write(f"   Link: {url}")

#         return response
#     except (openai.error.APIError, openai.error.ServiceUnavailableError):
#         print("OpenAI GPT server busy! Please retry after a few minutes.")
#     except openai.error.AuthenticationError:
#         print("API Key invalid/ expired! Please check your API key.")
#     except openai.error.APIConnectionError:
#         print("Unable to connect to GPT server! Please check your internet connection and firewall/ proxy settings.")
#     except (openai.error.Timeout, openai.error.RateLimitError):
#         print("Request timed-out! Please retry after a few minutes.")


def get_predefined_response(query, qafinal, qaembeddings):
    query_embedding = get_embedding(query)
    question_similarities = sorted([(vector_similarity(query_embedding, question_embedding), question_no) \
                                    for question_no, question_embedding in qaembeddings.items()], \
                                   reverse=True)
    if question_similarities[0][0] > 0.9:
        most_similar_question_idx = question_similarities[0][1]
        response = f"""Conclusion: {qafinal.loc[most_similar_question_idx, "answer"]}\n\n
            NOTE: This is a pre-defined answer since I am {round(question_similarities[0][0], 1)*100}% sure that your
                question is similar to "{qafinal.loc[most_similar_question_idx, "question"]}" that has been answered in our FAQ.\ 
                Please re-phrase your question if you are not happy with my answer. Thank you!"""
    else:
        response = "No pre-defined answer found!"
    return response


def answer_conversationally(embeddings: dict, input_df: pd.DataFrame, question, temp, max_token):
    if "chat_history" in st.session_state and st.session_state["chat_history"]!="":
        messages = st.session_state["chat_history"]
    else:
        messages = [{"role": "system", "content": "You are an intellgent AI assistant designed to answer queries based on government policy documents. You answer as truthfully as possible at all times and tell the user if you do not know the answer."}]
        terminologies = """
                        Explanations of some terminologies used in questions/ policy documents are given below:
                        1. All Programs: All Programs refer to Food Assistance Program, Medicaid, CDC, SER and FIP (TANF).
                        2. Food Assistance Program (FAP): SNAP is referred to as FAP in Michigan.
                        """
        messages.append({"role": "system", "content": terminologies.replace("\t", " ")})
    if input_language!="English":
        print("Non-English input selected .....", end=" ")
        question = translate_text_using_gpt4(text=question, language="English", 
                                             max_token=max_token)
        print("Question translated to English at", str(datetime.datetime.now()))
    prompt, sources = construct_prompt_para(question, embeddings, input_df)
    messages.append({"role": "user", "content": question})
    messages.append({"role": "user", "content": prompt})
    answer, references = answer_query_with_context_using_gpt4_and_streaming(messages, sources,
                                                                            temp, max_token)
    print("Answer generated -", str(datetime.datetime.now()))
    reasoning = "Not Applicable"
    additional_info = "Not Applicable"
    conclusion = "Sorry, I am not sure of the answer to your question. Kindly consult with the appropriate agency for further assistance."
    if "Error" not in answer:
        if "Reasoning" in answer:
            answer = answer.split("Reasoning:")[1]
            if "Conclusion:" in answer:
                reasoning = answer.split("Conclusion:")[0].strip("\n ")
                conclusion = answer.split("Conclusion:")[1]
                if "Information required to provide a better answer:" in conclusion:
                    additional_info = conclusion.split("Information required to provide a better answer:")[1].strip("\n ")
                    if "None" in additional_info:
                        additional_info = "Not Applicable"
                    conclusion = conclusion.split("Information required to provide a better answer:")[0].strip("\n ")
                else:
                    conclusion = conclusion.strip("\n ")
            else:
                reasoning = answer.strip("\n ")
        detailed_answer = f"Reasoning:\n\n{reasoning}\n\n\nInformation required to provide a better answer:\n\n{additional_info}\n\n\nFurther Reading:\n"
        conclusion = conclusion.replace("**", "").replace("_", "-").replace("$", "USD ")
        detailed_answer = detailed_answer.replace("**", "").replace("_", "-").replace("$", "USD ")
        print("Answer reformatted -", str(datetime.datetime.now()))

        del messages[-1]
        messages.append({"role": "assistant", "content": answer})
        st.session_state["chat_history"] = messages
        if output_language!="English":
            print("Non-English output required!")
            translated_conclusion = translate_text_using_gpt4(text=f"Conclusion:\n{conclusion}",
                                                              language=output_language, max_token=max_token)
            print(f"Conclusion translated to {output_language} -", str(datetime.datetime.now()))
            translated_detailed_answer = translate_text_using_gpt4(text=detailed_answer, 
                                                                   language=output_language, max_token=max_token)
            translated_detailed_answer += f"\n{str(references)}"
            print(f"Detailed answer translated to {output_language} -", str(datetime.datetime.now()))
            return translated_conclusion, translated_detailed_answer
        else:
            detailed_answer += f"\n{str(references)}"
            return conclusion, detailed_answer
    else:
        raise Exception(f"{answer}")
    

# def user_queries(question, temp, max_token, method):
#     if method == "Intent Creation":
#         st.write("**Intent Creation Response:**")
#         response = answer_query_with_context_using_gpt4_and_intent_creation(
#             question, temp, max_token)
#         return {}

#     # Read the dataframe of text in PDFs after processing from a CSV file
#     doc_df = pd.read_csv("C:\GPS LLM\Work 0507\VectorDB\Case Worker\Processed_PDFs.csv")
#     doc_df.set_index(["doc_index"], inplace=True)
#     # Read the dictionary of embeddings created from all PDFs from a pickle file
#     EMBEDDING_FILE = "C:\GPS LLM\Work 0507\VectorDB\Case Worker\Embeddings.pkl"
#     with open(EMBEDDING_FILE, "rb") as embeddings_pkl:
#         doc_embeddings = pickle.load(embeddings_pkl)

#     prompt, sections, sources = construct_prompt_para(
#         question, doc_embeddings, doc_df, method)
#     if method == "Policy Citation":
#         st.write("**Policy Citation Response:**")
#         st.write("")
#         st.write("To get the required information for your query, you can refer to:")
#         for doc_no, section in enumerate(sections, start=1):
#             if doc_no <= 2:
#                 file = section.split("_")[0] + " " + section.split("_")[1]
#                 page = section.split("_")[2]
#                 st.write(f"{doc_no}. {file} Page {page}")
#         return {}

#     if method == "Process Flow With Validation":
#         # response_raw = answer_query_with_context_using_gpt35(prompt, question, temp, max_token)
#         response_raw = answer_query_with_context_using_gpt35(prompt)
#         # process.write(
#         #     "Received the response from GPT model. Feeding the response for validation.....")
#         validation_prompt = create_validation_para(question, response_raw)
#         validation_response = answer_query_with_context_using_gpt4_and_test_validation(
#             validation_prompt, temp, max_token)
#         # process.write(
#         #     "Validating the response if it is true/false or model is unsure with the answer")
#         if "True" in validation_response:
#             # process.write("Response is correct as per validation")
#             st.write(response_raw)
#             st.write("References (ordered by relevance):")
#             st.write("; ".join(sections))
#             st.write("")
#             st.write("References Document URLs:")
#         else:
#             # process.write("Response is not correct as per validation")
#             st.write("I am sorry, I am still learning and I am not sure about the response to that question. For more information, you can either refer to the following document(s) or may want to contact the appropriate agency for further assistance.")
#         for sr_no, url in enumerate(sources, start=1):
#             st.write(f"{sr_no}. " + url[46:49] + "-" + url[50:53] + ": " + url)
#         return {}

#     st.write("**Response:**")
#     response = answer_query_with_context_using_gpt4_and_streaming(
#         prompt, sections, sources, temp, max_token)
#     return response


def user_queries(question, temp, max_token):
    # Read the dataframe of text in PDFs after processing from a CSV file
    doc_df = pd.read_csv(data_folder + "/" + domain + "/" + PDF_FILE)
    doc_df.set_index(["doc_index"], inplace=True)
    print("Document DF loaded -", str(datetime.datetime.now()))
    # Read the dictionary of embeddings created from all PDFs from a pickle file
    with open(data_folder + "/" + domain + "/" + EMBEDDING_FILE, "rb") as embeddings_pkl:
        doc_embeddings = pickle.load(embeddings_pkl)
    print("Document Embeddings Loaded -", str(datetime.datetime.now()))
    conclusion, detailed_answer = answer_conversationally(doc_embeddings, doc_df, 
                                                              question, temp, max_token)
    return conclusion, detailed_answer


def get_domains(folder):
    sub_folders = [name for name in os.listdir(
        folder) if os.path.isdir(os.path.join(folder, name))]
    return sub_folders


def clear_text():
    st.session_state["chat_history"] = ""
    st.session_state["message"] = ""


st.set_page_config(page_title="Ask Me.AI")
st.title("Ask Me.AI")
st.write("I can assist you in answering complex policy, operational procedure, and system questions. I take publicly available data such as policy manuals, system documents, and process maps as inputs, and use Large Language models to provide answers.")
with st.sidebar:
    new_chat = st.button("Start New Chat", use_container_width=True, on_click=clear_text)
    if new_chat:
        print("***** New Chat Trigged! *****")
        clear_text()
    input_language = st.selectbox('**Input Language:**', ("English", "Spanish", "French", "German", "Chinese (Simplified)"))
    output_language = st.selectbox('**Output Language:**', ("English", "Spanish", "French", "German", "Chinese (Simplified)"))
    st.write("")
    st.write("")
    st.header("Configuration parameters")

    temp = st.slider("Temperature", min_value=0.0,
                     max_value=1.0, value=0.2, step=0.1)
    max_token = st.slider("Maximum Tokens", min_value=0,
                          max_value=2000, value=1024, step=2)
    context_length = st.slider("Max Context Length", min_value=2000,
                               max_value=5000, value=3000, step=250)
    # method = st.radio("Use Case", ("Process Flow With Validation",
    #                   "Policy Extraction", "Policy Citation", "Intent Creation"))
    method = "Policy Extraction"
    MODEL = st.radio("GPT Model", ("gpt-4-32k", "gpt-4", "gpt-3.5-turbo"))

    data_folder = "VectorDB"
    domain = st.selectbox("Domain", tuple(get_domains(data_folder)))
    PDF_FILE = "Processed_PDFs.csv"
    EMBEDDING_FILE = "Embeddings.pkl"

message_text = st.text_area("Enter your question to GPT: ", key='message')

if message_text != '':
    print(f"\n\n NEW QUESTION: {message_text}")
    print("\nStart Time -", datetime.datetime.now())
    # process.write("User asked a query")
    # if method == "Process Flow With Validation":
    #     # process.write(
    #     #     "Checking if question can be answered using pre-defined data")
    #     st.write("**Policy Extraction Response With Validation:**")
    #     with open("questions_embeddings.pkl", "rb") as ques_embed:
    #         quest_embeddings = pickle.load(ques_embed)
    #     pd_qa = pd.read_csv("qnafinal.csv")
    #     qa_response = get_response(message_text, pd_qa, quest_embeddings)
    #     if qa_response == "Not in pre-defined QA set":
    #         # process.write(
    #         #     "Question cannot be answered from QA set. Feeding the question to GPT model with context......")
    #         result = user_queries(message_text, temp, max_token, method)
    #     else:
    #         # process.write("Question is answered from QA set")
    #         st.write(qa_response)
    st.write("**User Query:**")
    st.write(message_text)
    st.write("")
    st.write("**Policy Extraction Response:**")
    with open(data_folder + "/" + domain + "/predefined_qa.pkl", "rb") as ques_embed:
        quest_embeddings = pickle.load(ques_embed)
    print("Predefined Embeddings loaded -", str(datetime.datetime.now()))
    pd_qa = pd.read_csv(data_folder + "/" + domain + "/predefined_qa.csv")
    print("Predefined QA Set loaded -", str(datetime.datetime.now()))
    predefined_response = get_predefined_response(message_text, pd_qa, quest_embeddings)
    print("Predefined Reponses Check Complete -", str(datetime.datetime.now()))
    if predefined_response=="No pre-defined answer found!":
        conclusion, detailed_answer = user_queries(message_text, temp, max_token)
        st.write("**:green[Conclusion:]**")
        st.write(conclusion)
        st.write("\n**:blue[Detailed Response:]**")
        st.write(detailed_answer)
    else:
        st.write("**:green[Conclusion:]**")
        st.write(predefined_response)