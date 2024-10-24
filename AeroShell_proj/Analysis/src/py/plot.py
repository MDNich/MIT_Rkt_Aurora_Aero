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

f_kwd = {
	"DyP" : "GG Average Dynamic Pressure 1",
	"M" : 'GG Average Mach Number 2',
	"F": 'GG Force 3',
	"Fx" : 'GG Force (X) 4',
	"Fy" : 'GG Force (Y) 5',
	"Fz" : 'GG Force (Z) 6',
	"Shr" : 'GG Average Shear Stress 7',
	"ShrX" : 'GG Average Shear Stress (X) 8',
	"ShrY" : 'GG Average Shear Stress (Y) 9',
	"ShrZ" : 'GG Average Shear Stress (Z) 10',
}
def importDataCSV(path):
	raw = np.loadtxt(path,dtype='str',delimiter=',')
	psd_avg = []
	psd_err = []
	for i in range(len(f_kwd.keys())):
		i += 1
		#print("proceeding for " + str(list(f_kwd.keys())[i-1]))
		psd_avg.append(float(raw[i][3]))
		psd_err.append(0.5*np.abs(float(raw[i][5])-float(raw[i][4])))
		#print(i)
		#print(len(psd_avg))
	#print("returning two arrays of sizes " + str(len(psd_avg)) + ", " + str(len(psd_err)))
	return np.array(psd_avg), np.array(psd_err)

header = "../../dat/csv/"
t = {
	"n" : 1,
	"o" : 2
}
m = {
	"0p5": 1,
	"1p0": 2,
	"1p5": 3,
	"2p0" : 4
}
a = {
	"0" : 1,
	"2" : 2,
	"5" : 3
}
mFLT = {
	"0p5": 0.5,
	"1p0": 1,
	"1p5": 1.5,
	"2p0" : 2
}
types = t.keys()
machs = m.keys()
aoas = a.keys()
end = ".csv"
lFs = []
lID = []
ctr1 = 0
ctr2 = 0
ctr3 = 0
for i in types:
	ctr1 += 1
	ctr2 = 0
	ctr3 = 0
	for j in machs:
		ctr2 += 1
		ctr3 = 0
		for k in aoas:
			ctr3+=1
			if ctr2 > 2:
				if ctr3 == 3:
					continue
			fn = header + i + "M" + j + "A" + k + end
			lFs.append(fn)
			lID.append(ctr1*100+ctr2*10+ctr3)
			print("Added file " + fn + " to queue with identifier " + str(lID[-1]))

d = {}
de = {}
for i in range(len(lID)):
	print("Parsing file " + lFs[i])
	d[lID[i]],de[lID[i]] = importDataCSV(lFs[i])

# d conține datele.

def getInfo_str(modelSTR,speedSTR,aoaSTR,paramSTR):
	#print("req:")
	#print(modelSTR)
	#print(speedSTR)
	#print(paramSTR)
	#print("ID: " + str(t[modelSTR]*10+m[speedSTR]))
	#print("place: " + str(f[paramSTR]))
	#print("inter: " + str(d[t[modelSTR]*10+m[speedSTR]]))
	return np.abs(d[t[modelSTR]*100+m[speedSTR]*10+a[aoaSTR]][f[paramSTR]])

def getInfo_int(modelINT,speedINT,aoaINT,paramINT):
	return d[modelINT*100+speedINT*10+aoaINT][paramINT]

# demonstrator: Fx of 1p5 new at 0 AoA:
#val = getInfo_str("n","1p5",'0',"Fx")
#print(val)



###### TABLE GEN ######

# TODO: pentru fiecare viteză (0p5 -> 2), 
# tabelă comparând cele două modele (new, old) 
# pentru caracteristicile următoare:

"""
	"DyP" : "GG Average Dynamic Pressure 1",
	"M" : 'GG Average Mach Number 2',

	"F": 'GG Force 3',
	"Fy" : 'GG Force (Y) 5',
	"Fz" : 'GG Force (Z) 6',

	"Shr" : 'GG Average Shear Stress 7',
	"ShrZ" : 'GG Average Shear Stress (Z) 10',
	"ShrY" : 'GG Average Shear Stress (Y) 9',
"""
def writeTabToSTDOUT():
	toTablSub = ["DyP","M","F","Fy","Fz","Shr","ShrY","ShrZ"]
	units = ["Pa","","N","N","N","Pa","Pa","Pa"]


	for i in range(len(m.keys())):
		v = list(m.keys())[i]
		print("---,---,---")
		out = "*" + v + "*," + "New,Old"
		for j in range(len(toTablSub)):
			#print("Current v " + str(v) + " param " + toTablSub[j])
			unitPart = ""
			if(units[j] != ""):
				unitPart = " (" + str(units[j]) + ")"
			out += "\n" + str(toTablSub[j]) + str(unitPart) + "," + str(np.round(getInfo_str("n",v,toTablSub[j]),'0',2)) + "," + str(np.round(getInfo_str("o",v,toTablSub[j]),'0',2))
		print(out)



###### PLOT ######
def plot():
	outPDF = '../out/figure1.pdf' # shear, force func viteza 
	matplotlib.rcParams['figure.figsize'] = (8.5, 11*2/3)  # 17,22
	plt.rc('font', size=12)  # controls default text size
	plt.rc('axes', labelsize=12)  # fontsize of the x and y labels
	plt.rc('xtick', labelsize=12)  # fontsize of the x tick labels
	plt.rc('ytick', labelsize=12)  # fontsize of the y tick labels
	plt.rc('legend', fontsize=10)  # fontsize of the legend
	print("init complete, beginning plotting...")
	# plt.rcParams['font.size'] = '10'
	with matplotlib.backends.backend_pdf.PdfPages(outPDF) as pdf:
		fig, axs = plt.subplots(nrows=2, ncols=2, sharex='col')
		plt.subplots_adjust(
			top=0.96,
			bottom=0.1,
			left=0.08,
			right=0.98,
			hspace=0.2,
			wspace=0.2
			)
 
		ax = axs[0][0]
		
		# prep for first two plots
		v = mFLT.values()
		vInd = list(m.values())
		forceNet_n = []
		forceNetY_n = []
		forceNetZ_n = []
		forceNetX_n = []
		ShrNet_n = []
		ShrZ_n = []
		ShrY_n = []

		forceNet_o = []
		forceNetY_o = []
		forceNetZ_o = []
		forceNetX_o = []
		ShrNet_o = []
		ShrZ_o = []
		ShrY_o = []


		forceNet_n_2 = []
		forceNetY_n_2 = []
		forceNetZ_n_2 = []
		forceNetX_n_2 = []
		ShrNet_n_2 = []
		ShrZ_n_2 = []
		ShrY_n_2 = []

		forceNet_o_2 = []
		forceNetY_o_2 = []
		forceNetZ_o_2 = []
		forceNetX_o_2 = []
		ShrNet_o_2 = []
		ShrZ_o_2 = []
		ShrY_o_2 = []

		for i in range(len(v)):
			forceNet_n.append(getInfo_int(t["n"],vInd[i],a['0'],f["F"]))
			forceNetX_n.append(getInfo_int(t["n"],vInd[i],a['0'],f["Fx"]))
			forceNetY_n.append(getInfo_int(t["n"],vInd[i],a['0'],f["Fy"]))
			forceNetZ_n.append(getInfo_int(t["n"],vInd[i],a['0'],f["Fz"]))
			ShrNet_n.append(getInfo_int(t["n"],vInd[i],a['0'],f["Shr"]))
			ShrZ_n.append(getInfo_int(t["n"],vInd[i],a['0'],f["ShrZ"]))
			ShrY_n.append(getInfo_int(t["n"],vInd[i],a['0'],f["ShrY"]))
			forceNet_o.append(getInfo_int(t["o"],vInd[i],a['0'],f["F"]))
			forceNetX_o.append(getInfo_int(t["o"],vInd[i],a['0'],f["Fx"]))
			forceNetY_o.append(getInfo_int(t["o"],vInd[i],a['0'],f["Fy"]))
			forceNetZ_o.append(getInfo_int(t["o"],vInd[i],a['0'],f["Fz"]))
			ShrNet_o.append(getInfo_int(t["o"],vInd[i],a['0'],f["Shr"]))
			ShrZ_o.append(getInfo_int(t["o"],vInd[i],a['0'],f["ShrZ"]))
			ShrY_o.append(getInfo_int(t["o"],vInd[i],a['0'],f["ShrY"]))

			forceNet_n_2.append(getInfo_int(t["n"],vInd[i],a['2'],f["F"]))
			forceNetX_n_2.append(getInfo_int(t["n"],vInd[i],a['2'],f["Fx"]))
			forceNetY_n_2.append(getInfo_int(t["n"],vInd[i],a['2'],f["Fy"]))
			forceNetZ_n_2.append(getInfo_int(t["n"],vInd[i],a['2'],f["Fz"]))
			ShrNet_n_2.append(getInfo_int(t["n"],vInd[i],a['2'],f["Shr"]))
			ShrZ_n_2.append(getInfo_int(t["n"],vInd[i],a['2'],f["ShrZ"]))
			ShrY_n_2.append(getInfo_int(t["n"],vInd[i],a['2'],f["ShrY"]))
			forceNet_o_2.append(getInfo_int(t["o"],vInd[i],a['2'],f["F"]))
			forceNetX_o_2.append(getInfo_int(t["o"],vInd[i],a['2'],f["Fx"]))
			forceNetY_o_2.append(getInfo_int(t["o"],vInd[i],a['2'],f["Fy"]))
			forceNetZ_o_2.append(getInfo_int(t["o"],vInd[i],a['2'],f["Fz"]))
			ShrNet_o_2.append(getInfo_int(t["o"],vInd[i],a['2'],f["Shr"]))
			ShrZ_o_2.append(getInfo_int(t["o"],vInd[i],a['2'],f["ShrZ"]))
			ShrY_o_2.append(getInfo_int(t["o"],vInd[i],a['2'],f["ShrY"]))

		masterArr = [forceNet_n,forceNetX_n,forceNetY_n,forceNetZ_n,ShrNet_n,ShrZ_n,ShrY_n,forceNet_o,forceNetX_o,forceNetY_o,forceNetZ_o,ShrNet_o,ShrZ_o,ShrY_o,forceNet_n_2,forceNetX_n_2,forceNetY_n_2,forceNetZ_n_2,ShrNet_n_2,ShrZ_n_2,ShrY_n_2,forceNet_o_2,forceNetY_o_2,forceNetY_o_2,forceNetZ_o_2,ShrNet_o_2,ShrZ_o_2,ShrY_o_2]
		newMaster = []
		for i in range(len(masterArr)):
			newMaster.append(np.array(masterArr[i]))
			newMaster[i] = np.abs(newMaster[i])
		forceNet_n,forceNetX_n,forceNetY_n,forceNetZ_n,ShrNet_n,ShrZ_n,ShrY_n,forceNet_o,forceNetX_o,forceNetY_o,forceNetZ_o,ShrNet_o,ShrZ_o,ShrY_o,forceNet_n_2,forceNetX_n_2,forceNetY_n_2,forceNetZ_n_2,ShrNet_n_2,ShrZ_n_2,ShrY_n_2,forceNet_o_2,forceNetY_o_2,forceNetY_o_2,forceNetZ_o_2,ShrNet_o_2,ShrZ_o_2,ShrY_o_2 = tuple(newMaster)
		
		zforces = np.array([forceNetZ_n,forceNetZ_o,forceNetZ_n_2,forceNetZ_o_2])
		xforces = np.array([forceNetX_n,forceNetX_o,forceNetX_n_2,forceNetX_o_2])
		#zforces *= 1200/np.max(zforces)
		forceNetZ_n,forceNetZ_o,forceNetZ_n_2,forceNetZ_o_2 = tuple(zforces)
		forceNetX_n,forceNetX_o,forceNetX_n_2,forceNetX_o_2 = tuple(xforces)
		ax.plot(v,forceNet_n,marker='v',linestyle='solid',c='royalblue',label="Net (New)")
		ax.plot(v,forceNetX_n,marker='v',linestyle='solid',c='steelblue',label="X (New)")
		ax.plot(v,forceNetY_n,marker='v',linestyle='solid',c='navy',label="Y (New)")
		ax.plot(v,forceNetZ_n,marker='v',linestyle='solid',c='skyblue',label="Z (New)")
		ax.plot(v,forceNet_o,marker='v',linestyle='dotted',c='royalblue',label="Net (Old)")
		ax.plot(v,forceNetX_o,marker='v',linestyle='dotted',c='steelblue',label="X (Old)")
		ax.plot(v,forceNetY_o,marker='v',linestyle='dotted',c='navy',label="Y (Old)")
		ax.plot(v,forceNetZ_o,marker='v',linestyle='dotted',c='skyblue',label="Z (Old)")
		ax.plot(v,forceNet_n_2,marker='x',linestyle='solid',c='royalblue',label="Net (New) A2")
		ax.plot(v,forceNetX_n_2,marker='x',linestyle='solid',c='steelblue',label="X (New) A2")
		ax.plot(v,forceNetY_n_2,marker='x',linestyle='solid',c='navy',label="Y (New) A2")
		ax.plot(v,forceNetZ_n_2,marker='x',linestyle='solid',c='skyblue',label="Z (New) A2")
		ax.plot(v,forceNet_o_2,marker='x',linestyle='dotted',c='royalblue',label="Net (Old) A2")
		ax.plot(v,forceNetX_o_2,marker='x',linestyle='dotted',c='steelblue',label="X (Old) A2")
		ax.plot(v,forceNetY_o_2,marker='x',linestyle='dotted',c='navy',label="Y (Old) A2")
		ax.plot(v,forceNetZ_o_2,marker='x',linestyle='dotted',c='skyblue',label="Z (Old) A2")
		ax.set_ylim(500,1200)
		ax.set_ylabel("Force (N)")
		ax.legend(loc='upper left',ncol=4,fontsize=4)
		ax.tick_params(axis='y', colors='royalblue')
		ax.yaxis.label.set_color('royalblue')

		ax2 = axs[0][1]
		ax2.plot(v,ShrNet_n,marker='o',linestyle='solid',c='red',label="Net (New)")
		ax2.plot(v,ShrZ_n,marker='o',linestyle='solid',c='maroon',label="Z (New)")
		ax2.plot(v,ShrY_n,marker='o',linestyle='solid',c='lightcoral',label="Y (New)")
		ax2.plot(v,ShrNet_o,marker='o',linestyle='dotted',c='red',label="Net (Old)")
		ax2.plot(v,ShrZ_o,marker='o',linestyle='dotted',c='maroon',label="Z (Old)")
		ax2.plot(v,ShrY_o,marker='o',linestyle='dotted',c='lightcoral',label="Y (Old)")
		ax2.plot(v,ShrNet_n_2,marker='x',linestyle='solid',c='red',label="Net (New) A2")
		ax2.plot(v,ShrZ_n_2,marker='x',linestyle='solid',c='maroon',label="Z (New) A2")
		ax2.plot(v,ShrY_n_2,marker='x',linestyle='solid',c='lightcoral',label="Y (New) A2")
		ax2.plot(v,ShrNet_o_2,marker='x',linestyle='dotted',c='red',label="Net (Old) A2")
		ax2.plot(v,ShrZ_o_2,marker='x',linestyle='dotted',c='maroon',label="Z (Old) A2")
		ax2.plot(v,ShrY_o_2,marker='x',linestyle='dotted',c='lightcoral',label="Y (Old) A2")
		ax2.legend(ncol=2,fontsize=6)
		ax2.set_ylim(0,375)
		ax2.yaxis.label.set_color('red')
		ax2.tick_params(axis='y', colors='red')
		ax2.set_ylabel("Shear Stress (Pa)")


		ax = axs[1][0] # lower left
		ax2 = axs[1][1] # lower right

		dyP_n = []
		M_n = []

		dyP_o = []
		M_o = []

		dyP_n_2 = []
		M_n_2 = []

		dyP_o_2 = []
		M_o_2 = []

		for i in range(len(v)):
			dyP_n.append(getInfo_int(t["n"],vInd[i],a['0'],f["DyP"]))
			M_n.append(getInfo_int(t["n"],vInd[i],a['0'],f["M"]))
			dyP_o.append(getInfo_int(t["o"],vInd[i],a['0'],f["DyP"]))
			M_o.append(getInfo_int(t["o"],vInd[i],a['0'],f["M"]))
			dyP_n_2.append(getInfo_int(t["n"],vInd[i],a['2'],f["DyP"]))
			M_n_2.append(getInfo_int(t["n"],vInd[i],a['2'],f["M"]))
			dyP_o_2.append(getInfo_int(t["o"],vInd[i],a['2'],f["DyP"]))
			M_o_2.append(getInfo_int(t["o"],vInd[i],a['2'],f["M"]))

		masterArr = [dyP_n,M_n,dyP_o,M_o,dyP_n_2,M_n_2,dyP_o_2,M_o_2]
		newMaster = []
		for i in range(len(masterArr)):
			newMaster.append(np.array(masterArr[i]))
			newMaster[i] = np.abs(newMaster[i])
		dyP_n,M_n,dyP_o,M_o,dyP_n_2,M_n_2,dyP_o_2,M_o_2 = tuple(newMaster)
		
		dyP_n *= 1e-4
		dyP_o *= 1e-4
		dyP_n_2 *= 1e-4
		dyP_o_2 *= 1e-4
		
		ax.plot(v,dyP_n,marker='s',markersize=5,linestyle='solid',c='green',label="New")
		ax.plot(v,dyP_o,marker='s',markersize=5,linestyle='dotted',c='green',label="Old")
		ax.plot(v,dyP_n_2,marker='x',markersize=5,linestyle='solid',c='green',label="New A2")
		ax.plot(v,dyP_o_2,marker='x',markersize=5,linestyle='dotted',c='green',label="Old A2")
		ax.set_ylim(0,26)
		ax.yaxis.label.set_color('green')
		ax.tick_params(axis='y', colors='green')
		ax.set_ylabel("Dynamic Pressure ($10^4$ Pa)")
		ax.legend()

		ax2.plot(np.linspace(0,3,1000),np.linspace(0,3,1000),linestyle='solid',alpha=0.4,c='k',label="Freestream")
		ax2.plot(v,M_n,marker='*',markersize=10,linestyle='solid',c='sandybrown',label="New")
		ax2.plot(v,M_o,marker='*',markersize=10,linestyle='dotted',c='saddlebrown',label="Old")
		ax2.plot(v,M_n_2,marker='o',markersize=4,linestyle='solid',c='red',alpha=0.5,label="New A2")
		ax2.plot(v,M_o_2,marker='o',markersize=4,linestyle='dotted',c='black',label="Old A2")
		ax2.legend()
		ax2.set_ylim(0.4,2)
		ax2.yaxis.label.set_color('saddlebrown')
		ax2.tick_params(axis='y', colors='saddlebrown')
		ax2.set_ylabel("Mach Number")
		


		ax.set_xlim(0.45,2.05)
		ax.set_xlabel("Mach Number")
		ax.set_xticks([0.5,1,1.5,2])

		ax2.set_xlim(0.45,2.05)
		ax2.set_xlabel("Mach Number")
		ax2.set_xticks([0.5,1,1.5,2])

		print("Rendering and saving to PDF...")
		pdf.savefig(fig)
		plt.close()

		print("COMPLETELY done!")




plot()











