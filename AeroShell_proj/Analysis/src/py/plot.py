#!/usr/bin/python3


import random
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib
from matplotlib import backends
from matplotlib.backends import backend_pdf
from matplotlib import rcParams
from matplotlib import colors
import scipy.special as spsp
import math
import scipy.optimize as spopt
matplotlib.rcParams.update(matplotlib.rcParamsDefault)
rcParams['text.usetex'] = True
rcParams['font.family'] = 'serif'
rcParams['font.sans-serif'] = ['CMU Serif']
rcParams['font.serif'] = ['CMU Serif']
plt.rc('text.latex', preamble=r'\usepackage{amsmath}\usepackage{amssymb}')

##### DATA ######

# FORMAT: [DyP, M, F, Fx, Fy, Fz, Shr, ShrX, ShrY, ShrZ]
# UNITÉS: [Pa,  #, N, ->          Pa, ->               ]

f = {
	"DyP" : 0,
	"M" : 1,
	"F": 2,
	"Fx" : 3,
	"Fy" : 4,
	"Fz" : 5,
	"Shr" : 6,
	"ShrX" : 7,
	"ShrY" : 8,
	"ShrZ" : 9,
}

# NOUVEAU

# MACH 0.5

n_m_0p5_dat = np.array([16100.33,0.47,567.578,-10.158,-567.478, 3.119,28.13,-0.31,2.19,26.50])
n_m_0p5_dat_err = 0.5*np.abs(np.array([16194.72-16003,0.47-0.46,568.494-567.052,-10.077+10.346,-566.953+568.389,3.566-2.788,29.09-27.69,-0.28+0.33,2.24-2.16,26.96-26.16]))




###### PLOT ######
def plot():
	outPDF = 'figure1.pdf'
	matplotlib.rcParams['figure.figsize'] = (8.5, 11*2/3)  # 17,22
	plt.rc('font', size=16)  # controls default text size
	plt.rc('axes', labelsize=12)  # fontsize of the x and y labels
	plt.rc('xtick', labelsize=12)  # fontsize of the x tick labels
	plt.rc('ytick', labelsize=12)  # fontsize of the y tick labels
	plt.rc('legend', fontsize=14)  # fontsize of the legend
	print("init complete, beginning plotting...")
	# plt.rcParams['font.size'] = '10'
	with matplotlib.backends.backend_pdf.PdfPages(outPDF) as pdf:
		fig, ax = plt.subplots(nrows=1, ncols=1, sharex='col')
 
		



		print("Rendering and saving to PDF...")
		pdf.savefig(fig)
		plt.close()

		print("COMPLETELY done!")

plot()




