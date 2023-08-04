# update the .env in the client folder to point to correct endpoints (update the PROJECT to an existing project in your local SEMOSS)

# Add to RDF_Map.prop:

#Moose
MOOSE_MODEL guanaco
MOOSE_ENDPOINT https://play.semoss.org/moose
GUANACO_ENDPOINT https://play.semoss.org/moose/guanaco/

# Add PY packages:

pip install Dataset
pip install text_generation

# FE install/run

make sure you are in the client folder in the terminal
pnpm install
pnpm dev (can open at localhost:3000)
